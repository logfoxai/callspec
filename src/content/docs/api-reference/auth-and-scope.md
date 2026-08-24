# Auth and scope

## Auth

Callspec keeps credentials out of the RPC contract. The client sends `Authorization: Bearer …`; that token is never part of the route's input pred or generated client types. You verify tokens however you already do &mdash; JWT, session lookup, API keys &mdash; in one **`authenticate(token, req)`** hook on the spec. Whatever your hook returns becomes handler **`ctx`**; routes that allow anonymous callers normally see `ctx: undefined`.

Per route, choose whether a valid token is required: **`auth: 'bearer'`** (default) or **`auth: 'none'`**. Callspec runs the gate before the handler &mdash; missing or invalid credentials → **401 `UNAUTHORIZED`**, and your handler never runs. If any route uses `'bearer'`, `spec` throws at load time when `authenticate` callback is missing.

- **`auth: 'none'`** &mdash; no credentials required; `ctx` is normally `undefined` unless set by `authenticate`
- **`auth: 'bearer'`** (default) &mdash; missing or invalid token → 401 before the handler runs

OpenAPI Bearer security is **auto-derived** from route `auth`.

## Scope

Scope controls whether a route is published in specs (and by extension, docs and generated clients). Scope allows you to have "undocumented" routes. These routes are mounted and available either way, and have nothing to do with `auth`.

- **`scope: 'public'`** (default) &mdash; on the public contract (`callspec.json`, OpenAPI, docs UI, SDK codegen, MCP `tools/list`)
- **`scope: 'private'`** &mdash; documented when this mount uses `visibility: 'all'`. Does not change the auth gate.

**`visibility`** on `mountSpec` / `emitCallspec` / `emitOpenApi` (default `'public'`):

- **`'public'`** &mdash; public-scope routes only (prod)
- **`'all'`** &mdash; public and private routes on the same `/docs` and JSON (dev/stage)

```typescript
mountSpec(router, api, {
    visibility: process.env.NODE_ENV === 'production' ? 'public' : 'all',
});
```

Callspec does not read `NODE_ENV` itself. There is no `npx callspec --scope` flag &mdash; the CLI reads whatever `callspec.json` the server already served. Point it at a mount that used `visibility: 'all'` if you want private methods in the client.

← [`mountSpec`](./mount-spec.md) · Next: [Surfaces & exports](./surfaces-and-exports.md)
