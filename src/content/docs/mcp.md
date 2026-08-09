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

When **any** route has `mcp: true`, `mountSpec` serves MCP at **`{mount}/mcp`** (override with `mcpPath`). Only `scope: 'public'` routes appear in `tools/list` — `scope: 'private'` stays mounted for HTTP but is hidden from MCP.

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
| Tools | One MCP tool per `mcp: true` + `scope: 'public'` route |
| Input / output | Same preds as the RPC method |
| Errors | Same codes as HTTP / the generated SDK (`NOT_FOUND`, domain errors, …) |
| Auth | Per-route `auth` — bearer tools reject missing/invalid tokens like private HTTP |

## Related

- [Docs UI](./docs-ui.md) — connect panel and try-it for humans
- [`mountSpec` options](./api-reference/mount-spec.md) — `mcpPath`, `docs`
- [Builtin errors](./builtin-errors.md) — codes tools and clients share
