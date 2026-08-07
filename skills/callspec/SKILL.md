---
name: callspec
description: >-
  Use when defining callspec routes, mountSpec, SDK codegen, Result-typed errors,
  MCP, or generated ApiClient code. Read before changing RPC APIs or error contracts.
disable-model-invocation: true
---

# Callspec

Spec-first TypeScript RPC: one `route()` registry → typed RPC, SDK, MCP, docs, OpenAPI.

Human docs (guide site sources on `next`): [src/content/docs](https://github.com/logfoxai/callspec/tree/next/src/content/docs). Repo README: [README.md](https://github.com/logfoxai/callspec#readme).

## Task → doc

| Task | Read first |
|------|------------|
| New project / first route | [getting-started.md](https://github.com/logfoxai/callspec/blob/next/src/content/docs/getting-started.md) |
| Cursor / coding-agent skill | [coding-agents.md](https://github.com/logfoxai/callspec/blob/next/src/content/docs/coding-agents.md) · this file |
| File layout for routes & schemas | [server-layout.md](https://github.com/logfoxai/callspec/blob/next/src/content/docs/server-layout.md) |
| Single-file copy-paste | [complete-example.md](https://github.com/logfoxai/callspec/blob/next/src/content/docs/complete-example.md) |
| Test resolver logic (no HTTP) | [unit-testing.md](https://github.com/logfoxai/callspec/blob/next/src/content/docs/unit-testing.md) |
| Bearer auth & `authenticate` | [authentication.md](https://github.com/logfoxai/callspec/blob/next/src/content/docs/authentication.md) |
| Resolver context typing | [request-context.md](https://github.com/logfoxai/callspec/blob/next/src/content/docs/request-context.md) |
| `route`, `spec`, `mountSpec` API | [api-reference.md](https://github.com/logfoxai/callspec/blob/next/src/content/docs/api-reference.md) (hub → resolvers, route-and-spec, mount-spec, auth-and-scope, surfaces-and-exports) |
| Errors & Result contract | [error-handling.md](https://github.com/logfoxai/callspec/blob/next/src/content/docs/error-handling.md) |
| Generate / pin TypeScript SDK | [sdk-generation.md](https://github.com/logfoxai/callspec/blob/next/src/content/docs/sdk-generation.md) |
| Use generated client in app | [client-usage.md](https://github.com/logfoxai/callspec/blob/next/src/content/docs/client-usage.md) |
| Shared preds & `--validators` | [shared-validation.md](https://github.com/logfoxai/callspec/blob/next/src/content/docs/shared-validation.md) |
| Docs UI & branding | [docs-ui.md](https://github.com/logfoxai/callspec/blob/next/src/content/docs/docs-ui.md) |
| MCP tools on your API | [mcp.md](https://github.com/logfoxai/callspec/blob/next/src/content/docs/mcp.md) |
| OpenAPI export (not codegen input) | [openapi.md](https://github.com/logfoxai/callspec/blob/next/src/content/docs/openapi.md) |
| Fern vs Callspec | [using-fern-with-callspec.md](https://github.com/logfoxai/callspec/blob/next/src/content/docs/using-fern-with-callspec.md) |
| Contribute / guide site / Node versions | [development.md](https://github.com/logfoxai/callspec/blob/next/src/content/docs/development.md) |

## Invariants (do not get wrong)

1. **Return failures from resolvers** — `return err.NOT_FOUND()` / domain handles. Prefer return over throw for expected failures. Bare `throw Error` becomes `INTERNAL_ERROR`.
2. **Codegen reads `callspec.json`**, not OpenAPI. CLI: `npx callspec <mount-or-file> --output …`. OpenAPI is for gateways, Fern, contract tests.
3. **Default SDK = `ApiClient`**. `--validators` is opt-in for `spec.exports` form preds.
4. **`scope: 'private'`** — server-only; omitted from SDK, docs, OpenAPI, MCP list. Still mounted. Does not skip auth.
5. **`auth: 'bearer'` is the default** if omitted; it requires `authenticate` on `spec()` — throws at load time if missing. Use `auth: 'none'` for public routes.
6. **After route/error changes** — regenerate client (`npx callspec …`) and commit pinned contract if the repo pins it.
7. **Branch on `result.code`** when `!result.ok`, not HTTP status alone. Client-only codes include `NETWORK_ERROR` and `UNKNOWN_ERROR`.
8. **Do not wire Express error middleware (or jsout) on `mountSpec` routers** — mountSpec owns catch path, logging, and `INTERNAL_ERROR`. Use `handleUnhandledError` / `logging: false` / `logRequest` only as docs describe.
9. **Never re-declare builtin codes** on route `errors:` — builtins merge at `route` time (`VALIDATION_ERROR`, `UNAUTHORIZED`, `NOT_FOUND`, …).
10. **Domain codes must be registered** on the route (`defineErrors`); undeclared domain returns are a compile error.
11. **Do not show `UNKNOWN_ERROR.data` to end users** — log / devtools only.

## Anti-patterns

- Don’t codegen from OpenAPI or treat OpenAPI as the source of truth for the TypeScript SDK.
- Don’t treat Fern’s docs MCP as Callspec’s `/mcp` API tools — different surfaces ([using-fern-with-callspec.md](https://github.com/logfoxai/callspec/blob/next/src/content/docs/using-fern-with-callspec.md)).
- Don’t put UI-only form fields in the shared spec ([shared-validation.md](https://github.com/logfoxai/callspec/blob/next/src/content/docs/shared-validation.md)).
- Prefer generated `ApiClient` over raw `CallspecClient` for app code.
- Don’t add hand-rolled Express error middleware on the Callspec router.

## Default mount URLs

With `app.use('/v1', router)` and `mountSpec` defaults (`docs: true`, any route `mcp: true`):

| Surface | Path |
|---------|------|
| RPC | `POST /v1/{methodName}` |
| Docs UI | `/v1/docs` |
| Contract | `/v1/callspec.json` |
| OpenAPI | `/v1/openapi.json` |
| MCP | `/v1/mcp` |

`docsPath` / `mcpPath` are overridable; `/callspec.json` and `/openapi.json` paths are fixed when those surfaces are enabled.

## Package imports

| Import | Use |
|--------|-----|
| `callspec` | `route`, `spec`, `mountSpec`, `defineErrors`, `err`, `logRequest`, `BUILTIN_ERROR`; types `Callspec`, `RoutesMap`, `MountSpecOptions`, `RouteFailure`, `Authenticate`, … |
| `callspec/client` | `CallspecClient`, `isCallspecOk`, `CLIENT_ERROR`, `BUILTIN_ERROR`, `normalizeClientErrorBody`; generated `ApiClient` base |
| `callspec/document` | `emitCallspec`, `emitOpenApi`, `parseCallspecDocument`, `generateClientFile`, `generateValidatorsFile` |

## Ignore (not product docs)

Do not treat as API or user documentation:

- `docs/internal/` — plans, review notes, implementation deep-dives
