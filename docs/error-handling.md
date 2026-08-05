# Callspec error handling

Design reference for the callspec error contract, mountSpec runtime, and client Result shape.

## Overview

- **`defineErrors()`** — domain error maps; shorthand **`err`** is builtins-only.
- **Return failures from handlers** — `return err.NOT_FOUND()` / `return registerErr.USER_EXISTS({ … })`; success is a plain route output object.
- **`RouteFailure`** — `{ ok: false, code, status, data? }` from handlers and from `defineErrors` / `err` handles.
- **Builtins on every route** — merged at `defineRoute` time; automatic in OpenAPI, `callspec.json`, and every client `*Result` union. Do not re-declare builtin codes on routes.
- **Strict domain registration** — returned domain codes must appear on the route; TypeScript checks handler return types against `errors:` at compile time (no runtime allowlist).
- **`BUILTIN_ERROR`** — one constant namespace for all automatic codes (validation, auth, route-not-found, etc.).
- Client Result — `{ ok: true, value } | { ok: false, status, code, data? }`. Branch on `code` when `!result.ok`. Every failure union includes client-only **`UNKNOWN_ERROR`** (HTTP response outside the route contract) and **`NETWORK_ERROR`** (no HTTP response — DNS, offline, abort; `status: 0`).
- **Codegen** — after changing routes or error specs, rerun `npx callspec …` and refresh generated client types.

Framework validation and auth **throw** `CallspecValidationError` / `CallspecUnauthorizedError` — mountSpec maps those inline. Any other unhandled error becomes **`INTERNAL_ERROR`** (see [mountSpec runtime](#mountspec-runtime)).

## mountSpec runtime

For RPC routes mounted with `mountSpec`, **errors and logging are owned by callspec** — you do not wire `expressErrorHandler`, jsout, or jsout-express on that router for normal operation.

```typescript
mountSpec(router, spec); // request log + catch path + INTERNAL_ERROR — zero extra middleware
```

### Catch order (per request)

After `executeRoute` returns or throws:

| Step | Condition | HTTP response | Default error log |
|------|-----------|---------------|-------------------|
| 1 | Handler **returns** `RouteFailure` | Wire failure (`sendRouteFailureResponse`) | None |
| 2 | Handler **throws** `RouteFailure` | Wire failure | None |
| 3 | `CallspecValidationError` (input validation) | 400 `VALIDATION_ERROR` + `errors` | None |
| 4 | `CallspecUnauthorizedError` (private route, bad/missing token) | 401 `UNAUTHORIZED` | None |
| 5 | `handleUnhandledError(err, req)` returns `RouteFailure` | Wire failure | **You** choose (mountSpec skips default error log) |
| 6 | Anything else (bug, rejected promise, unknown throw) | 500 `INTERNAL_ERROR` | jsout `logger.error` via `logUnhandledError` |

**Success** is step 0: HTTP **200** + route output JSON — no error log.

Steps 1–4 are intentional contract outcomes. Step 6 is for unexpected failures: synchronous `throw new Error('…')`, rejected async handlers, driver/library throws, etc.

### Logging

| Event | Who | When | Default |
|-------|-----|------|---------|
| RPC request | `mountSpec` → jsout-express `logRequest` | Every request on the mounted router (on response finish) | On when `logging !== false` |
| Unhandled bug | `logUnhandledError` | Catch step 6 only | `logger.error(undefined, err, { url, method })` |
| Infra / known throw | Your `handleUnhandledError` | Catch step 5 | Your level — e.g. `logger.warn` for query timeout, no log for benign cases |
| Intentional failure | — | Steps 1–4 | No error log |

**`MountSpecOptions`:**

| Option | Default | Purpose |
|--------|---------|---------|
| `logging` | `true` | `false` silences request logging and default error logging (use in tests) |
| `handleUnhandledError` | — | Map known throws to `RouteFailure` before step 6 |
| `logUnhandledError` | jsout `logger.error` | Override only the step-6 error log |

Re-exported **`logRequest`** from `callspec` is the same jsout-express middleware — use it on **other** Express routers (upload, webhooks) so request logs match.

### Known infrastructure throws

Handle expected non-bug throws in `handleUnhandledError`. Return a `RouteFailure` to respond on the wire; return `undefined` to fall through to log + `INTERNAL_ERROR`.

```typescript
import { err, mountSpec } from 'callspec';
import { logger } from 'jsout';

mountSpec(router, spec, {
  handleUnhandledError(thrown, req) {
    if (isKnownTransientFailure(thrown)) {
      logger.warn('transient failure', thrown);
      return err.SERVICE_UNAVAILABLE({ message: 'Try again.' });
    }
  },
});
```

Import **`err`** (builtins-only handle) or your domain handle — do not confuse the caught value with the callspec handle.

### Non-RPC Express routes

Routes **outside** `mountSpec` (multipart upload, custom middleware) still use Express `next(err)`:

- **`expressErrorHandler()`** from `callspec/express` — maps `RouteFailure` throws and framework errors to callspec JSON
- **`logRequest`** from `callspec` — optional request logging on those routers

Malformed JSON on a router with `body-parser` may hit your app-level handler before RPC runs.

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
- **Required pred** — `data` always present on validated domain failures; builtins like `VALIDATION_ERROR` and `ROUTE_NOT_FOUND` require wire payloads when typed
- **Optional pred** (`p.optional(...)`) — `{ code }` alone is valid; include `data` only when the wire payload validates (`TOO_MANY_REQUESTS`, `NOT_FOUND`, etc.)
- **No pred** — no `data` property

When the client cannot validate a declared domain error payload (missing/invalid `data`), the failure becomes **`UNKNOWN_ERROR`** with the raw body. The client **never invents** payload fields.

Domain and builtin specs use the same mechanism — declare `data: p.optional(yourPred)` for optional typed context.

Domain errors omit `status` to default to **400** (`DEFAULT_ROUTE_ERROR_STATUS`). Override `status` only when you care about HTTP/OpenAPI transport mapping.

## Client error normalization

`CallspecClient.callResult` maps failures to typed `{ ok: false, status, code, data? }` results. **`INTERNAL_ERROR` is only used when the server sends that code on the wire** — the client never invents it during HTTP normalization.

### Transport failures

If `fetch` throws (DNS failure, offline, abort, etc.) before any HTTP response, the client returns:

```typescript
{ ok: false, status: 0, code: 'NETWORK_ERROR', data: { message, name? } }
```

`status: 0` means no response. `data.message` / `data.name` come from the thrown `Error` when available. This is client-only (not in `callspec.json`).

### HTTP failure pipeline (in order)

1. **Exact callspec JSON** — `{ error: "CODE", data? }` (and `errors` on `VALIDATION_ERROR`). Builtin codes and route-declared domain codes map to typed failures when the wire shape validates. Domain payloads are checked against `callspec.json` schemas (codegen passes `domainErrors`). An `{ error }` field that fails validation or is undeclared becomes **`UNKNOWN_ERROR`** (preserves raw body).
2. **Exact body phrases** — case-insensitive literals such as `Unauthorized`, `Forbidden`, `Bad Gateway`, `Service Unavailable`.
3. **HTTP status** — takes priority over fuzzy body matching. Examples: 401 → `UNAUTHORIZED`, 502/503/504 → `SERVICE_UNAVAILABLE`, 429 → `TOO_MANY_REQUESTS` (code only when the body has no validated payload). Unmapped statuses fall through.
4. **Fuzzy body match** — strip HTML for matching only; normalize case/spacing/underscores; map phrases (`badgateway`, `unauthorized`, …) and code-like strings to known builtins or declared domain codes.
5. **`UNKNOWN_ERROR`** (client-only, not in `callspec.json`) — `{ code: 'UNKNOWN_ERROR', data: { body, headers? } }`. **`body` is the raw parsed response** (string or JSON) for operator debugging; **`headers`** are response headers when present. Do not show `UNKNOWN_ERROR.data` to end users — log or devtools only.

HTML tag stripping applies **only** while matching (steps 2–4). It is not applied to `UNKNOWN_ERROR.data.body`.

For non-RPC / legacy routes, **`normalizeClientErrorBody(status, body, options?)`** from `callspec/client` runs the same HTTP pipeline (optional `responseHeaders` in options).

## Handler pattern

Preds and errors once; extracted handler + helpers; `defineRoute` wires and checks:

```typescript
import {defineRoute, defineErrors, err, isRouteFailure, type RouteFailuresFrom} from 'callspec';
import {predicates as p, type Infer} from 'runtyp';

const registerInput = p.object({email: p.string()});
const registerOutput = p.object({userId: p.string()});
const registerErr = defineErrors({
    USER_ALREADY_EXISTS: {},
});

function ensureAvailable(email: string): void | RouteFailuresFrom<typeof registerErr> {
    if (taken) return registerErr.USER_ALREADY_EXISTS();
}

async function registerHandler(
    input: Infer<typeof registerInput>,
    _ctx: unknown,
) {
    const blocked = ensureAvailable(input.email);
    if (isRouteFailure(blocked)) return blocked;
    return {userId: '…'};
}

defineRoute({
    input: registerInput,
    output: registerOutput,
    errors: registerErr,
    meta: {summary: 'Register', description: 'Create a user account.', tags: ['auth']},
    handler: registerHandler,
});

// anywhere in handler or helper:
return err.NOT_FOUND({message: '…'});
```

Helpers return `RouteFailuresFrom<typeof registerErr>` (or `void` / domain data); callers propagate with `if (isRouteFailure(x)) return x`.

Express middleware that cannot return through mountSpec may still **`throw`** a `RouteFailure` object; use `isRouteFailure` + `sendRouteFailureResponse` in the error handler.

**Legacy `RouteError` (Error subclass):** still supported for throws via `isRouteError` / `expressErrorHandler`. Prefer `RouteFailure` returns; new code should not introduce `RouteError`.

## Rules

- Return failures via `defineErrors()` handles (`err`, `defineErrors({ DOMAIN: … })`)
- Builtins are always allowed — merged onto every route at definition time
- Undeclared domain returns are a **compile error** on the route handler (routes without `errors:` allow builtins only)
- **`CallspecClient.callResult`** — see [Client error normalization](#client-error-normalization). Mapped HTTP failures use builtins + route-declared codes; unmapped responses are **`UNKNOWN_ERROR`**; transport failures are **`NETWORK_ERROR`**.
