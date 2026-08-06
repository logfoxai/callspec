# Tiers & wire format

## Two tiers

| Tier | Declared on route? | In every `*Result`? | Production |
|------|-------------------|---------------------|------------|
| Builtin | No (merged at `defineRoute`) | Yes | `return err.NOT_FOUND()` etc. |
| Domain | Yes (`errors: defineErrors({ … })`) | Only that route | `return registerErr.USER_EXISTS(…)` |

### Builtin codes

| Code | Typical HTTP status | Source |
|------|---------------------|--------|
| `VALIDATION_ERROR` | 400 | mountSpec (input validation) |
| `UNAUTHORIZED` | 401 | mountSpec (missing/invalid auth) |
| `ROUTE_NOT_FOUND` | 404 | mountSpec (unknown RPC method) |
| `NOT_FOUND` | 404 | resolver (`return err.NOT_FOUND()`) |
| `FORBIDDEN` | 403 | resolver or middleware |
| `CONFLICT` | 409 | resolver |
| `TOO_MANY_REQUESTS` | 429 | rate-limit middleware |
| `SERVICE_UNAVAILABLE` | 503 | resolver or middleware |
| `INTERNAL_ERROR` | 500 | mountSpec (unhandled throw or rejected promise in resolver) |

`ROUTE_NOT_FOUND` and `NOT_FOUND` both use HTTP 404 but mean different things — the **`code`** is the contract; status is a transport hint.

## Wire format and HTTP status

**Contract:** `{ error: "CODE", data? }` (plus `errors` on `VALIDATION_ERROR`).

- **Success:** HTTP **200** + route output JSON.
- **Failure:** HTTP **4xx/5xx** + error JSON — never 200 with an error body.

HTTP status is **not** the semantic layer. It exists for:

1. Sending the response (`RouteFailure.status` or mountSpec defaults)
2. OpenAPI documentation (grouping schemas by status)
3. Client fallback when foreign Express middleware returns a bare status without `{ error }`

Generated clients and app code should branch on **`result.code`** when `!result.ok`, not `result.status`. The client maps wire `{ error, data? }` to `{ ok: false, status, code, data? }`.

Codegen types each route's `{Route}Result` so **`result.code` is a fully exhaustive union** — declared domain errors, builtins (`VALIDATION_ERROR`, `UNAUTHORIZED`, …), and client-only codes (`NETWORK_ERROR`, `UNKNOWN_ERROR`). A `switch (result.code)` with a `never` default (or equivalent) gets compile-time exhaustiveness checking.

**`data` on the client Result** mirrors the error spec's `data` pred:
- **Required pred** — `data` always present on validated domain failures; builtins like `VALIDATION_ERROR` and `ROUTE_NOT_FOUND` require wire payloads when typed
- **Optional pred** (`p.optional(...)`) — `{ code }` alone is valid; include `data` only when the wire payload validates (`TOO_MANY_REQUESTS`, `NOT_FOUND`, etc.)
- **No pred** — no `data` property

When the client cannot validate a declared domain error payload (missing/invalid `data`), the failure becomes **`UNKNOWN_ERROR`** with the raw body. The client **never invents** payload fields.

Domain and builtin specs use the same mechanism — declare `data: p.optional(yourPred)` for optional typed context.

Domain errors omit `status` to default to **400** (`DEFAULT_ROUTE_ERROR_STATUS`). Override `status` only when you care about HTTP/OpenAPI transport mapping.

← [Error handling](../error-handling.md)
