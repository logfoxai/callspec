# Callspec error handling

Design reference for the callspec error contract, mountSpec runtime, and client Result shape.

## Overview

- **`defineErrors()`** — domain error maps; shorthand **`err`** is builtins-only.
- **Return failures from handlers** — `return err.NOT_FOUND()` / `return registerErr.USER_EXISTS({ … })`; success is a plain route output object.
- **`RouteFailure`** — `{ ok: false, code, status, data? }` from handlers and from `defineErrors` / `err` handles.
- **Builtins on every route** — merged at `route` time; automatic in OpenAPI, `callspec.json`, and every client `*Result` union. Do not re-declare builtin codes on routes.
- **Strict domain registration** — returned domain codes must appear on the route; TypeScript checks handler return types against `errors:` at compile time (no runtime allowlist).
- **`BUILTIN_ERROR`** — one constant namespace for all automatic codes (validation, auth, route-not-found, etc.).
- Client Result — `{ ok: true, value } | { ok: false, status, code, data? }`. Branch on `code` when `!result.ok`. Every failure union includes client-only **`UNKNOWN_ERROR`** (HTTP response outside the route contract) and **`NETWORK_ERROR`** (no HTTP response — DNS, offline, abort; `status: 0`).
- **Codegen** — after changing routes or error specs, rerun `npx callspec …` and refresh generated client types.

Framework validation and auth **throw** `CallspecValidationError` / `CallspecUnauthorizedError` — mountSpec maps those inline. Any other unhandled error becomes **`INTERNAL_ERROR`** (see [mountSpec runtime](#mountspec-runtime)).

## mountSpec runtime

For RPC routes mounted with `mountSpec`, **errors and logging are owned by callspec** — you do not wire jsout or jsout-express on that router for normal operation.

```typescript
mountSpec(router, spec); // JSON parse + request log + catch path + INTERNAL_ERROR — no extra host middleware
```

Do **not** wire host error middleware, `express.json()`, or jsout on this router — mountSpec owns JSON parse and the catch path.

### Catch order (per request)

Malformed JSON is handled in `express.json` middleware **before** `executeRoute`. After `executeRoute` returns or throws:

<div class="cs-table-scroll">

<table>
  <colgroup>
    <col style="width: 3.5rem" />
    <col style="width: 38%" />
    <col style="width: 28%" />
    <col style="width: 30%" />
  </colgroup>
  <thead>
    <tr>
      <th>Step</th>
      <th>Condition</th>
      <th>HTTP response</th>
      <th>Default error log</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>Malformed JSON (<code>SyntaxError</code> with <code>body</code> from <code>express.json</code>) — before <code>executeRoute</code></td>
      <td>400 <code>VALIDATION_ERROR</code> + <code>errors: { body: "Malformed JSON" }</code></td>
      <td>None</td>
    </tr>
    <tr>
      <td>2</td>
      <td>Handler <strong>returns</strong> <code>RouteFailure</code></td>
      <td>Wire failure (<code>sendRouteFailureResponse</code>)</td>
      <td>None</td>
    </tr>
    <tr>
      <td>3</td>
      <td>Handler <strong>throws</strong> <code>RouteFailure</code></td>
      <td>Wire failure</td>
      <td>None</td>
    </tr>
    <tr>
      <td>4</td>
      <td><code>CallspecValidationError</code> (input validation)</td>
      <td>400 <code>VALIDATION_ERROR</code> + <code>errors</code></td>
      <td>None</td>
    </tr>
    <tr>
      <td>5</td>
      <td><code>CallspecUnauthorizedError</code> (private route, bad/missing token)</td>
      <td>401 <code>UNAUTHORIZED</code></td>
      <td>None</td>
    </tr>
    <tr>
      <td>6</td>
      <td><code>handleUnhandledError(err, req)</code> returns <code>RouteFailure</code></td>
      <td>Wire failure</td>
      <td><strong>You</strong> choose (<code>mountSpec</code> skips default error log)</td>
    </tr>
    <tr>
      <td>7</td>
      <td>Anything else (bug, rejected promise, unknown throw)</td>
      <td>500 <code>INTERNAL_ERROR</code></td>
      <td>jsout <code>logger.error</code> via <code>logUnhandledError</code></td>
    </tr>
  </tbody>
</table>

</div>

**Success** is step 0: HTTP **200** + route output JSON — no error log.

Steps 1–5 are intentional contract outcomes. Step 7 is for unexpected failures: synchronous `throw new Error('…')`, rejected async handlers, driver/library throws, etc.

### Logging

<div class="cs-table-scroll">

<table>
  <colgroup>
    <col style="width: 18%" />
    <col style="width: 26%" />
    <col style="width: 28%" />
    <col style="width: 28%" />
  </colgroup>
  <thead>
    <tr>
      <th>Event</th>
      <th>Who</th>
      <th>When</th>
      <th>Default</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>RPC request</td>
      <td><code>mountSpec</code> → jsout-express <code>logRequest</code></td>
      <td>Every request on the mounted router (on response finish)</td>
      <td>On when <code>logging !== false</code></td>
    </tr>
    <tr>
      <td>Unhandled bug</td>
      <td><code>logUnhandledError</code></td>
      <td>Catch step 7 only</td>
      <td><code>logger.error(undefined, err, { url, method })</code></td>
    </tr>
    <tr>
      <td>Infra / known throw</td>
      <td>Your <code>handleUnhandledError</code></td>
      <td>Catch step 6</td>
      <td>Your level — e.g. <code>logger.warn</code> for query timeout, no log for benign cases</td>
    </tr>
    <tr>
      <td>Intentional failure</td>
      <td>—</td>
      <td>Steps 1–5</td>
      <td>No error log</td>
    </tr>
  </tbody>
</table>

</div>

**`MountSpecOptions`:**

| Option | Default | Purpose |
|--------|---------|---------|
| `logging` | `true` | `false` silences request logging and default error logging (use in tests) |
| `handleUnhandledError` | — | Map known throws to `RouteFailure` before step 7 |
| `logUnhandledError` | jsout `logger.error` | Override only the step-7 error log |

Custom middleware around this router: [Outside Callspec](./outside-callspec.md). File uploads belong on the spec — see [File uploads](./file-uploads.md).

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

## Two tiers

| Tier | Declared on route? | In every `*Result`? | Production |
|------|-------------------|---------------------|------------|
| Builtin | No (merged at `route`) | Yes | `return err.NOT_FOUND()` etc. |
| Domain | Yes (`errors: defineErrors({ … })`) | Only that route | `return registerErr.USER_EXISTS(…)` |

### Builtin codes

Full tables (handler `err.*`, mountSpec-produced, client-only `NETWORK_ERROR` / `UNKNOWN_ERROR`): **[Builtin errors](./builtin-errors.md)**.

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

For fuzzy-matching implementation notes, see `docs/internal/` in the repo (not published on the guide site).

## Handler pattern

Preds once in a route def; helpers use `RouteFailuresFrom`:

```typescript
import {route, defineErrors, err, isRouteFailure, type RouteFailuresFrom} from 'callspec';
import {predicates as p} from 'runtyp';

const registerErr = defineErrors({USER_ALREADY_EXISTS: {}});

function ensureAvailable(email: string): void | RouteFailuresFrom<typeof registerErr> {
    if (taken) return registerErr.USER_ALREADY_EXISTS();
}

export const register = route({
    input: p.object({email: p.string()}),
    output: p.object({userId: p.string()}),
    errors: registerErr,
    meta: {summary: 'Register', tags: ['auth']},
    handler: async (input, _ctx) => {
        const blocked = ensureAvailable(input.email);
        if (isRouteFailure(blocked)) return blocked;
        return {userId: '…'};
    },
});

// anywhere in handler or helper:
return err.NOT_FOUND({message: '…'});
```

Helpers return `RouteFailuresFrom<typeof registerErr>` (or `void` / domain data); callers propagate with `if (isRouteFailure(x)) return x`.

## Rules

- Return failures via `defineErrors()` handles (`err`, `defineErrors({ DOMAIN: … })`)
- Builtins are always allowed — merged onto every route at definition time
- Undeclared domain returns are a **compile error** on the route handler (routes without `errors:` allow builtins only)
- **`CallspecClient.callResult`** — see [Client error normalization](#client-error-normalization). Mapped HTTP failures use builtins + route-declared codes; unmapped responses are **`UNKNOWN_ERROR`**; transport failures are **`NETWORK_ERROR`**.

