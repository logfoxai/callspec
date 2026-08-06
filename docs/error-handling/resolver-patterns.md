# Resolver patterns & rules

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
    resolver: async (input, _ctx) => {
        const blocked = ensureAvailable(input.email);
        if (isRouteFailure(blocked)) return blocked;
        return {userId: '…'};
    },
});

// anywhere in resolver or helper:
return err.NOT_FOUND({message: '…'});
```

Helpers return `RouteFailuresFrom<typeof registerErr>` (or `void` / domain data); callers propagate with `if (isRouteFailure(x)) return x`.

Express middleware that cannot return through mountSpec may still **`throw`** a `RouteFailure` object; use `isRouteFailure` + `sendRouteFailureResponse` in the error handler.

**Legacy `RouteError` (Error subclass):** still supported for throws via `isRouteError` / `expressErrorHandler`. Prefer `RouteFailure` returns; new code should not introduce `RouteError`.

## Rules

- Return failures via `defineErrors()` handles (`err`, `defineErrors({ DOMAIN: … })`)
- Builtins are always allowed — merged onto every route at definition time
- Undeclared domain returns are a **compile error** on the route resolver (routes without `errors:` allow builtins only)
- **`CallspecClient.callResult`** — see [Client error normalization](client-normalization.md). Mapped HTTP failures use builtins + route-declared codes; unmapped responses are **`UNKNOWN_ERROR`**; transport failures are **`NETWORK_ERROR`**.

← [Error handling](../error-handling.md)
