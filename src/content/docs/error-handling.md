# Callspec error handling

Callspec treats failure as a normal part of your API contract. Expected outcomes (not found, email already taken): return a code (`NOT_FOUND`, `USER_ALREADY_EXISTS`) instead of throwing undocumented exceptions that must be caught, or switching on ambiguous HTTP status codes. Unexpected failures still get a predefined code on `result.code` such as `INTERNAL_ERROR`, `VALIDATION_ERROR`, `NETWORK_ERROR`, and others.

| Situation | Auto-logged by `mountSpec`? | Client returns |
| --- | --- | --- |
| Returned built-in or declared domain error | No | the code you returned |
| Returned domain code not on the route | No (should fail TypeScript first) | `UNKNOWN_ERROR` |
| Uncaught throw | Yes | `INTERNAL_ERROR` |

## Returning errors from a route

### Built-in errors

Every route gets [built-in errors](./builtin-errors.md) like `NOT_FOUND`, `FORBIDDEN`, and `SERVICE_UNAVAILABLE` without adding an `errors:` field. Example:

```typescript
import {route, err} from 'callspec';
import {predicates as p} from 'runtyp';

export const getProductById = route({
    input: p.object({id: p.string()}),
    output: p.object({id: p.string(), name: p.string()}),
    meta: {summary: 'Get product by ID', tags: ['catalog']},
    auth: 'none',
    handler: async (input, _ctx) => {
        const found = products.find((item) => item.id === input.id);
        if (!found) return err.NOT_FOUND();
        return found;
    },
});
```

Use `err.*`. [See all built-ins](./builtin-errors.md).

### Custom domain errors

When built-ins aren't enough &mdash; email already taken, bad operation, that kind of thing &mdash; declare your own codes with `defineErrors()`:

```typescript
import {route, defineErrors} from 'callspec';
import {predicates as p} from 'runtyp';

const registerErr = defineErrors({USER_ALREADY_EXISTS: {}});

export const register = route({
    input: p.object({email: p.string()}),
    output: p.object({userId: p.string()}),
    errors: registerErr,
    meta: {summary: 'Register', tags: ['auth']},
    handler: async (input, _ctx) => {
        if (emailTaken(input.email)) return registerErr.USER_ALREADY_EXISTS();
        return {userId: '…'};
    },
});
```

TypeScript should catch returns outside the contract at build time. If one still reaches the client, it becomes `UNKNOWN_ERROR` with the raw wire body preserved for debugging ([Client usage: UNKNOWN_ERROR](./client-usage.md#unknown_error)).

### Helpers

You can return failures from helper functions too, not just from the handler body. Give the helper a return type that includes the route's domain failures (`RouteFailuresFrom<typeof yourErrors>`). Back in the handler, if `isRouteFailure(result)` is true, return that result:

```typescript
import {route, defineErrors, isRouteFailure, type RouteFailuresFrom} from 'callspec';
import {predicates as p} from 'runtyp';

const registerErr = defineErrors({USER_ALREADY_EXISTS: {}});

function ensureAvailable(email: string): void | RouteFailuresFrom<typeof registerErr> {
    if (emailTaken(email)) return registerErr.USER_ALREADY_EXISTS();
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
```

### Unexpected throws

For real bugs, just throw. That is fine &mdash; in fact it is what we recommend. You do not need to catch and return `INTERNAL_ERROR` yourself:

```typescript
export const boom = route({
    input: p.object({}),
    output: p.string(),
    meta: {summary: 'Boom', tags: ['debug']},
    auth: 'none',
    handler: async (_input, _ctx) => {
        throw new Error('database connection lost');
    },
});
```

The generated client returns `{ ok: false, code: 'INTERNAL_ERROR', status: 500 }`. For security reasons, the error details are not included; they stay in server logs. With default options (`logging: true`), `mountSpec` logs uncaught throws. There is no separate logger option. Pass `logging: false` in tests to silence that and request logging, or pass a `logUnhandledError(err, req)` callback to use your own logger like so:

```typescript
mountSpec(router, spec, {
    logging: false,
    logUnhandledError(err, req) {
        myLogger.error('RPC handler threw', {err, url: req.url});
    },
});
```

### Mapping known throws

Sometimes a dependency throws something you recognize &mdash; DB timeout, connection reset &mdash; and you want a proper failure code instead of `INTERNAL_ERROR`. Register that at the **mount** with `handleUnhandledError`, not inside every handler:

```typescript
import {err, mountSpec} from 'callspec';

mountSpec(router, spec, {
    handleUnhandledError(thrown, _req) {
        if (isDbTimeout(thrown)) {
            return err.SERVICE_UNAVAILABLE({message: 'Try again.'});
        }
    },
});
```

Return a built-in failure from `err.*` to respond on the wire. This hook is mount-wide, not per-route, so stick to built-ins here; domain codes belong in handlers where the route declares them. Return `undefined` (or nothing) to fall through to `INTERNAL_ERROR`.

## On the client

Built-in, domain, and framework failures all look the same: `{ ok: false, code, status, data? }`. The server-side distinction does not matter here. Branch on `result.code`. Just make sure you regenerate the client when you change route errors (`npx callspec …`)!

```typescript
const result = await api.register({email});

if (!result.ok) {
    switch (result.code) {
        case 'USER_ALREADY_EXISTS':
            showError('That email is already registered');
            return;
        case 'VALIDATION_ERROR':
            showFieldErrors(result.data);
            return;
        default:
            handleFailure(result); // NOT_FOUND, INTERNAL_ERROR, NETWORK_ERROR, …
            return;
    }
}

signIn(result.value);
```

Handle the codes that matter for that screen; send the rest through a shared helper. See [Client usage](./client-usage.md).

## Debugging reference

When something does not match the guide above.

### mountSpec request flow

Which code fires when: [Builtin errors](./builtin-errors.md).

1. Malformed JSON → `VALIDATION_ERROR` (handler never runs)
2. Missing/invalid auth → `UNAUTHORIZED`
3. Input pred fails → `VALIDATION_ERROR`
4. Handler `return err.*` (or domain handle) → that code at its HTTP status; success value → `200`
5. Handler throws → thrown `RouteFailure` same as step 4; else `handleUnhandledError` may map ([Mapping known throws](#mapping-known-throws)); else log and respond `500` + `INTERNAL_ERROR` ([Unexpected throws](#unexpected-throws))

`logging`, `handleUnhandledError`, `logUnhandledError`: [mountSpec](./api-reference/mount-spec.md).

### Client HTTP pipeline

When `!result.ok`, the client resolves `result.code` in order:

1. Exact callspec JSON (`{ error, data? }`)
2. Known body phrases (`Unauthorized`, …)
3. HTTP status (401 → `UNAUTHORIZED`, 502/503/504 → `SERVICE_UNAVAILABLE`, …)
4. Fuzzy body match (HTML stripped for matching)
5. `UNKNOWN_ERROR` with raw `data.body` for operators

Undeclared codes and invalid domain payloads become `UNKNOWN_ERROR`; the client never invents typed fields. User-facing handling: [Client usage: UNKNOWN_ERROR](./client-usage.md#unknown_error). Non-RPC routes: `normalizeClientErrorBody` from `callspec/client`.
