# mountSpec runtime

For RPC routes mounted with `mountSpec`, **errors and logging are owned by callspec** — you do not wire `expressErrorHandler`, jsout, or jsout-express on that router for normal operation.

```typescript
mountSpec(router, spec); // request log + catch path + INTERNAL_ERROR — zero extra middleware
```

## Catch order (per request)

After `executeRoute` returns or throws:

| Step | Condition | HTTP response | Default error log |
|------|-----------|---------------|-------------------|
| 1 | Resolver **returns** `RouteFailure` | Wire failure (`sendRouteFailureResponse`) | None |
| 2 | Resolver **throws** `RouteFailure` | Wire failure | None |
| 3 | `CallspecValidationError` (input validation) | 400 `VALIDATION_ERROR` + `errors` | None |
| 4 | `CallspecUnauthorizedError` (private route, bad/missing token) | 401 `UNAUTHORIZED` | None |
| 5 | `handleUnhandledError(err, req)` returns `RouteFailure` | Wire failure | **You** choose (mountSpec skips default error log) |
| 6 | Anything else (bug, rejected promise, unknown throw) | 500 `INTERNAL_ERROR` | jsout `logger.error` via `logUnhandledError` |

**Success** is step 0: HTTP **200** + route output JSON — no error log.

Steps 1–4 are intentional contract outcomes. Step 6 is for unexpected failures: synchronous `throw new Error('…')`, rejected async resolvers, driver/library throws, etc.

## Logging

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

## Known infrastructure throws

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

## Non-RPC Express routes

Routes **outside** `mountSpec` (multipart upload, custom middleware) still use Express `next(err)`:

- **`expressErrorHandler()`** from `callspec/express` — maps `RouteFailure` throws and framework errors to callspec JSON
- **`logRequest`** from `callspec` — optional request logging on those routers

Malformed JSON on a router with `body-parser` may hit your app-level handler before RPC runs.

← [Error handling](../error-handling.md)
