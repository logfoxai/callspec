# Callspec error handling

Design reference — implemented in v0.3.0.

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
