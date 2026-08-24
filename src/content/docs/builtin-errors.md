# Builtin errors

Every route’s client Result includes these codes automatically &mdash; plus any domain codes you declare with `defineErrors`. Branch on **`result.code`** when `!result.ok`. Do **not** re-declare builtin codes on route `errors:`.

Design / mountSpec catch path: [Error handling: mountSpec request flow](./error-handling.md#mountspec-request-flow).

## Return from handlers

Use `import {err} from 'callspec'` (or your `defineErrors` handle &mdash; builtins are always merged in). **Return** failures; don’t throw for expected outcomes.

| Code | HTTP | Typical use | Optional `data` |
|------|------|-------------|-----------------|
| `NOT_FOUND` | 404 | Resource missing | `message?`, `description?` |
| `FORBIDDEN` | 403 | Authenticated but not allowed | `message?`, `description?` |
| `TOO_MANY_REQUESTS` | 429 | Rate limit / quota | `title?`, `message?` |
| `SERVICE_UNAVAILABLE` | 503 | Dependency down, try later | `message?`, `description?` |

State conflicts (duplicate key, version mismatch) are **domain** errors &mdash; declare them with `defineErrors` and your own HTTP status (often 409).

```typescript
import {err} from 'callspec';

if (!found) return err.NOT_FOUND({message: 'Unknown sku'});
```

`NOT_FOUND` (handler) ≠ `ROUTE_NOT_FOUND` (unknown RPC method) &mdash; both are HTTP 404; the **code** is the contract.

## Produced by mountSpec

You usually do **not** return these from handlers. The framework puts them on the wire; the client still switches on the same `result.code`.

| Code | HTTP | When |
|------|------|------|
| `VALIDATION_ERROR` | 400 | Input fails the route `input` pred &mdash; `data` is field → message map |
| `UNAUTHORIZED` | 401 | Bearer/auth required and missing or invalid |
| `ROUTE_NOT_FOUND` | 404 | RPC method path not in the mounted spec &mdash; `data.route` |
| `INTERNAL_ERROR` | 500 | Unhandled throw / rejected promise in the handler (or anything not mapped by `handleUnhandledError`) |

Bare `throw new Error(…)` → `INTERNAL_ERROR`. Expected failures should **`return err.*`**.

## Client-only (never on the wire from your handler)

Always in every generated `*Result` union. You cannot `return` these from a server handler &mdash; the SDK synthesizes them.

| Code | `status` | When | `data` |
|------|----------|------|--------|
| `NETWORK_ERROR` | `0` | `fetch` failed before any HTTP response (DNS, offline, abort, …) | `{ message, name? }` from the thrown `Error` when available |
| `UNKNOWN_ERROR` | HTTP status of the response | Response outside the route contract (proxy HTML, undeclared `{ error }`, invalid domain payload, …) | `{ body, headers? }` &mdash; **debug only; do not show to end users** |

Typical client pattern (handle what you care about + shared default): [Client usage](./client-usage.md).

Normalization details (status fallbacks, fuzzy body match): [Error handling: client HTTP pipeline](./error-handling.md#client-http-pipeline).
