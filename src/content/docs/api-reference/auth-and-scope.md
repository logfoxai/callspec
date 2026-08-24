# Auth and scope

See [Authentication](../authentication.md) and [Request context](../request-context.md) for full examples.

- **`auth: 'none'`** &mdash; no credentials required
- **`auth: 'bearer'`** (default) &mdash; 401 without valid Bearer token
- **`authenticate(token, req)`** on the spec &mdash; your hook; callspec extracts Bearer and calls it with the Express `req`

**Scope** is who can see the route in docs and specs. The route still mounts either way.

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

OpenAPI Bearer security is **auto-derived** from route `auth`.

← [`mountSpec`](./mount-spec.md) · Next: [Surfaces & exports](./surfaces-and-exports.md)
