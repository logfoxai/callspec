# MCP Server

Expose selected RPC methods as **MCP tools** on your running server. Agents call the same handlers as HTTP — same auth, validation, and error codes. This is live API access, not a docs chatbot.

## Enable tools

```typescript
export const getProductById = route({
    // …
    auth: 'none', // or 'bearer'
    mcp: true,    // opt this method into tools/list
    handler: async (input, ctx) => { /* … */ },
});
```

The tool name defaults to the route key. Override it or pass MCP annotations with the object form — see [`route` § MCP](./api-reference/route.md#mcp).

When **any** route has `mcp` set, `mountSpec` serves MCP at **`{mount}/mcp`** (override with `mcpPath`). By default only `scope: 'public'` routes appear in `tools/list`. Private MCP tools are listed when this mount uses `visibility: 'all'`. HTTP still works either way.

## Connect a client

1. Run your API (`mountSpec` on e.g. `/v1`).
2. Open the [Docs UI](./docs-ui.md) home page → **MCP connect** for the URL and copy-paste snippets.
3. Or point the client at `http://127.0.0.1:3000/v1/mcp` yourself (Cursor, Claude Desktop, etc.).

Bearer tools: send the same `Authorization: Bearer …` header your RPC clients use. Customize the hint shown in the docs panel with `meta.authHint`. Text agents see on MCP `initialize` with `meta.mcpInstructions` (not shown as docs chrome).

```typescript
spec({
    meta: {
        title: 'Acme Catalog API',
        version: '1.0.0',
        authHint: 'Header: Authorization: Bearer <key>',
        mcpInstructions: 'Search catalog and check stock. Writes need a Bearer token.',
    },
    routes: {getProductById, updateStock},
});
```

## What agents get

| | |
|--|--|
| Tools | One MCP tool per `mcp: true` route that this mount’s `visibility` includes (`scope: 'public'`, or private when `visibility` is `'all'`) |
| Input / output | Same preds as the RPC method |
| Errors | Same codes as HTTP / the generated SDK (`NOT_FOUND`, domain errors, …) |
| Auth | Per-route `auth` — bearer tools reject missing/invalid tokens like private HTTP |

[`file()`](./file-uploads.md) routes cannot be MCP tools. `tools/call` is JSON arguments; upload routes reject JSON. Leave `mcp` unset. This is a limitation of Callspec’s MCP adapter, not of HTTP uploads.

## Observability

HTTP access logs (`logRequest` on the mount) still cover `POST /mcp` as one request line.

Separately, each MCP **`tools/call`** emits a structured **call** event (jsout `info` by default when `logging` is on):

| Field | Meaning |
|-------|---------|
| `surface` | `'mcp'` |
| `route` | Route key (or tool name when unknown) |
| `durationMs` | Handler wall time |
| `outcome` | `'ok'` or `'error'` |
| `code` | Builtin/domain code (or synthetic `TOOL_NOT_FOUND`, …) when `outcome` is `'error'` |

This is **not** the HTTP access log — it is one event per tool invocation so you can meter agents without parsing MCP JSON-RPC bodies.

```typescript
import {mountSpec, type CallEvent} from 'callspec';

mountSpec(router, api, {
    onCall: (event: CallEvent) => {
        // Forward to Logfox / your sink later
        console.log(event);
    },
});
```

Pass `onCall: () => {}` to keep HTTP access logs but silence call events. Pass `logging: false` to silence both (tests).

## Related

- [Docs UI](./docs-ui.md) — connect panel and try-it for humans
- [`route` § MCP](./api-reference/route.md#mcp) — `mcp: true` vs `{ name?, annotations? }`
- [`mountSpec` options](./api-reference/mount-spec.md) — `mcpPath`, `docs`, `onCall`
- [Builtin errors](./builtin-errors.md) — codes tools and clients share
