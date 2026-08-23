# mountSpec

```typescript
mountSpec(router, spec, options?: MountSpecOptions)
```

| Option | Default | Description |
|--------|---------|-------------|
| `basePath` | `''` | Prefix for RPC paths and for paths baked into emitted documents |
| `docs` | `true` | Pass `false` to disable `/docs`, `/callspec.json`, and `/openapi.json` at the mount root |
| `visibility` | `'public'` | `'public'` — public-scope routes only. `'all'` — also document `scope: 'private'` routes on this mount (dev/stage). See [Auth and scope](./auth-and-scope.md). |
| `docsPath` | `'/docs'` | Docs UI path on this router (`callspec.json` and `openapi.json` paths are fixed) |
| `mcpPath` | `'/mcp'` | MCP HTTP endpoint on this router |
| `logging` | `true` | jsout-express request log on this router + jsout error log on unhandled throws; pass `false` in tests |
| `json` | `express.json()` | JSON body parser + malformed-JSON → `VALIDATION_ERROR`. Pass `{ limit }` (or other `express.json` options), or `false` to skip parser and parse-error middleware |
| `onCall` | jsout `call` info when `logging` | Structured per-call events for MCP `tools/call` (`CallEvent`). Custom sink for Logfox; `() => {}` to disable call events only |
| `handleUnhandledError` | — | `(err, req) => RouteFailure \| undefined` — map infra throws before `INTERNAL_ERROR` |
| `logUnhandledError` | jsout `logger.error` | Override unhandled-error logging only |

When `docs` is enabled, the docs UI fetches **`callspec.json`** at `/callspec.json` on this router (fixed path). Override only the UI mount:

```typescript
mountSpec(router, spec, {docsPath: '/explorer'});
// UI at /explorer — still loads ../callspec.json relative to that path
```

Document private routes on this same `/docs` with `visibility: 'all'`:

```typescript
mountSpec(router, spec, {
    visibility: process.env.NODE_ENV === 'production' ? 'public' : 'all',
});
```

See [Error handling § mountSpec runtime](../error-handling.md#mountspec-runtime).

With `app.use('/v1', router)` and defaults, a server on port 3000 exposes:

| Surface | URL |
|---------|-----|
| Docs UI | `http://127.0.0.1:3000/v1/docs` |
| Contract | `http://127.0.0.1:3000/v1/callspec.json` |
| OpenAPI | `http://127.0.0.1:3000/v1/openapi.json` |
| RPC | `POST http://127.0.0.1:3000/v1/{methodName}` |
| MCP | `http://127.0.0.1:3000/v1/mcp` (when any route has `mcp: true`) |

← [`spec`](./spec.md) · Next: [Auth and scope](./auth-and-scope.md)

