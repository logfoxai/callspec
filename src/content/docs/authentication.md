# Authentication

Credentials are per-route, not in the input pred.

| `auth` | Behavior |
|--------|----------|
| `'none'` | No token required — resolver gets `ctx: undefined` unless the client sent a Bearer token and you wired `authenticate` |
| `'bearer'` (default) | Missing or invalid token → **401 `UNAUTHORIZED`** before the resolver runs |

Any route with `auth: 'bearer'` requires `authenticate` on the spec — `spec` throws at load time if it is missing.

## `authenticate` is a function

Auth logic is a **function** you pass once on the spec — not a string. Callspec extracts the Bearer token, then calls your function:

```typescript
// server/auth.ts
import type {Authenticate} from 'callspec';

export type Ctx = {userId: string};

export const authenticate: Authenticate<Ctx> = async (token, req) => {
    // Custom logic: JWT, session store, API key table, etc.
    const session = await verifySession(token, req);
    if (!session) return undefined; // → 401 UNAUTHORIZED on bearer routes
    return {userId: session.userId};
};
```

```typescript
// server/routes.ts
export const api = spec({
    meta: {title: 'My API', version: '1.0.0'},
    authenticate,
    routes: {getProfile, publicHealth},
});
```

```typescript
// server/routes/getProfile.ts
import {route} from 'callspec';
import {predicates as p} from 'runtyp';
import type {Ctx} from '../auth';

export const getProfile = route({
    input: p.object({}),
    output: p.object({userId: p.string()}),
    meta: {summary: 'Get profile', tags: ['users']},
    auth: 'bearer',
    resolver: async (_input, ctx: Ctx) => ({userId: ctx.userId}),
});
```

### Per-route vs shared authenticate

- **Per-route:** choose `auth: 'none' | 'bearer'` on each `route()`. That is the only per-route auth switch today.
- **Shared:** one `authenticate` function on `spec({ authenticate })` runs for every bearer route. You cannot attach a different authenticate function to a single route — put branching inside that function (e.g. by `req.path` / route name) if you need route-specific rules.

## Client

Pass the token on every call:

```typescript
const api = new ApiClient({
    baseUrl: 'http://127.0.0.1:3000/v1',
    headers: () => ({Authorization: `Bearer ${getSessionToken()}`}),
});
```

## Docs and MCP

Set `meta.authHint`. OpenAPI Bearer security is derived from route `auth` automatically.

`scope: 'private'` hides a route from exports (SDK, docs, OpenAPI) but does not change the auth gate. See [API reference](./api-reference.md).

For richer context from headers and JWT claims, see [Request context](./request-context.md).

**Related:** [Builtin errors](./error-handling.md#builtin-codes) (`UNAUTHORIZED`) · [Auth and scope](./api-reference/auth-and-scope.md)
