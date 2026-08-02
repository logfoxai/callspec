# Callspec error handling

Design reference — implemented in v2.0.0.

## Breaking changes (v2.0.0)

Upgrading from v1.x:

- **`errors()` → `defineErrors()`** — domain error maps use `defineErrors({ … })`; shorthand `err` is builtins-only.
- **Return failures from handlers** — `return err.NOT_FOUND()` / `return registerErr.USER_EXISTS({ … })`; success is a plain output object (no `ok()` wrapper).
- **`RouteFailure`** — `{ ok: false, code, status, data? }` returned by handlers and `defineErrors` / `err` handles.
- **`commonErrors` removed** — do not spread legacy common maps. Builtins merge onto every route at `defineRoute` time.
- **Do not declare builtin codes on routes** — they are automatic in OpenAPI, `callspec.json`, and every client `*Result` union.
- **Strict domain registration** — returned domain codes must be declared on the route; TypeScript checks handler return types against `errors:` at compile time (no runtime allowlist).
- **`BUILTIN_ERROR` replaces `FRAMEWORK_ERROR` / `COMMON_ERROR`** — one constant for all automatic codes.
- **Flat client Result** — `{ ok: true, value } | { ok: false, status, code, data? }` (not wire-shaped `{ error }`).
- **Regenerate artifacts** — rerun `npx callspec …` and refresh generated client types after upgrading.

Framework validation and auth **throw** `CallspecValidationError` / `CallspecUnauthorizedError` — mountSpec maps those inline. Any other unhandled error becomes **`INTERNAL_ERROR`** (see below).

## Unhandled errors → `INTERNAL_ERROR`

Anything that escapes a route handler — and is **not** an intentional `RouteFailure` return/throw or a framework validation/auth throw — becomes **`INTERNAL_ERROR`**: HTTP **500** and wire body `{ "error": "INTERNAL_ERROR" }`.

This includes:

- Synchronous throws (`throw new Error('…')`)
- Rejected promises from async handlers (propagate through `await` in `executeRoute`)

**mountSpec handles this end-to-end** — no separate error middleware or logger wiring for RPC routes. It logs unhandled errors with **jsout** (`logger.error`, serialized automatically) and logs every request with **jsout-express** (`logRequest` on the mounted router):

```typescript
mountSpec(router, spec); // INTERNAL_ERROR + jsout request/error logging
```

Pass `logging: false` in tests to silence output. Override `logUnhandledError` only if you need custom behavior.

`expressErrorHandler()` remains exported for **non-callspec** Express routes (upload handlers, custom middleware) that use `next(err)`.

### Logfox api-service

RPC logging is fully owned by `mountSpec` on `apiRouter`. App-level `logRequest` (re-exported from callspec) covers `/upload` and other non-RPC routes; `/health` and `/v1` are skipped to avoid duplicate or probe noise. `errorHandler.ts` covers non-RPC errors (malformed JSON, postgres `57014` → `SERVICE_UNAVAILABLE`).

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
| `NOT_FOUND` | 404 | handler (`return err.NOT_FOUND()`) |
| `FORBIDDEN` | 403 | handler or middleware |
| `CONFLICT` | 409 | handler |
| `TOO_MANY_REQUESTS` | 429 | rate-limit middleware |
| `SERVICE_UNAVAILABLE` | 503 | handler or middleware |
| `INTERNAL_ERROR` | 500 | mountSpec (unhandled throw or rejected promise in handler) |

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

**`data` on the client Result** mirrors the error spec's `data` pred:
- **Required pred** — `data` always present (`TOO_MANY_REQUESTS`, domain errors with required payload)
- **Optional pred** (`p.optional(...)`) — `data` on the wire only when provided; declare `data: p.optional(yourPred)` on the error spec (builtins like `NOT_FOUND` use optional `{ message?, description? }`)
- **No pred** — no `data` property

Domain and builtin specs use the same mechanism — declare `data: p.optional(yourPred)` for optional typed context.

Domain errors omit `status` to default to **400** (`DEFAULT_ROUTE_ERROR_STATUS`). Override `status` only when you care about HTTP/OpenAPI transport mapping.

## Handler pattern

```typescript
import { defineErrors, err, defineRoute } from 'callspec';

const registerErr = defineErrors({
  USER_ALREADY_EXISTS: {},
});

defineRoute({
  output: p.object({ userId: p.string() }),
  errors: registerErr,
  handler: async (input, ctx) => {
    if (taken) return registerErr.USER_ALREADY_EXISTS();
    return { userId: '…' }; // plain success — no ok() wrapper
  },
});

// Handler return type is checked: only registerErr codes + builtins allowed.
// Use RouteFailuresFrom<typeof registerErr> on extracted resolver functions.

// anywhere in handler or helper:
return err.NOT_FOUND({ message: '…' });
```

Helpers can return `RouteFailuresFrom<typeof err>` / domain handles, or `SessionContext | BuiltinRouteFailures`; callers propagate with `if (isRouteFailure(x)) return x`.

Express middleware that cannot return through mountSpec may still **`throw`** a `RouteFailure` object; use `isRouteFailure` + `sendRouteFailureResponse` in the error handler.

## Rules

- Return failures via `defineErrors()` handles (`err`, `defineErrors({ DOMAIN: … })`)
- Builtins are always allowed — merged onto every route at definition time
- Undeclared domain returns are a **compile error** on the route handler (routes without `errors:` allow builtins only)
- Client `normalizeClientErrorBody(status, body)` maps foreign Express middleware responses to builtin types

## Logfox

- **api-service:** `domainErrors.ts` domain handles + `RouteFailuresFrom` aliases; per-route `errors:` in `routes.ts`; helpers/resolvers return typed failures matching the route contract
- **app-frontend:** work with `CallspecRouteResult` directly; branch on `BUILTIN_ERROR` / domain codes — no `unwrapCallspec` bridge
