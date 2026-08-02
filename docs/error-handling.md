# Callspec error handling

Design reference — implemented in v2.0.0.

## Breaking changes (v2.0.0)

Upgrading from v1.x:

- **`commonErrors` removed** — do not spread `{…commonErrors}` into `errors()`. Common throwers (`NOT_FOUND`, `FORBIDDEN`, `CONFLICT`, `TOO_MANY_REQUESTS`, `SERVICE_UNAVAILABLE`) are always on every `errors()` / `err` handle.
- **Do not declare common codes on routes** — they are automatic in OpenAPI, `callspec.json`, and every client `*Result` union.
- **Strict domain registration** — throws with codes not declared on the route become `INTERNAL_ERROR` at runtime.
- **`CallspecRouteError` no longer exported** — use `isRouteError` and `sendRouteErrorResponse` in Express middleware; throw only via `errors()` handles.
- **Regenerate artifacts** — rerun `npx callspec …` and refresh generated client types after upgrading.

## Three tiers

| Tier | Declared on route? | In every `*Result`? | Production |
|------|-------------------|---------------------|------------|
| Framework | No | Yes | callspec automatic |
| Common | No | Yes | `throw err.NOT_FOUND()` etc. |
| Domain | Yes (`errors({ … })`) | Only that route | `throw err.USER_EXISTS(…)` |

## Rules

- Wire shape: `{ error: string, data? }`
- Throw only via `errors()` handles (`err`, `errors({ DOMAIN: … })`)
- Common throwers are always on every handle — do not redeclare common codes
- Undeclared domain throw → `INTERNAL_ERROR`
- Client `normalizeClientErrorBody(status, body)` maps Express middleware responses to framework/common types

## Logfox

- **api-service:** `domainErrors.ts` domain handles; per-route `errors:` in `routes.ts`; `sendRouteErrorResponse` in Express error handler
- **app-frontend:** work with `CallspecRouteResult` directly; no `unwrapCallspec` bridge
