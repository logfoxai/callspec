# Authentication

Credentials are per-route, not in the input pred.

| `auth` | Behavior |
|--------|----------|
| `'none'` | No token required — resolver gets `ctx: undefined` unless the client sent a Bearer token and you wired `authenticate` |
| `'bearer'` (default) | Missing or invalid token → **401 `UNAUTHORIZED`** before the resolver runs |

Any route with `auth: 'bearer'` requires `authenticate` on the spec — `spec` throws at load time if it is missing.

```typescript
// server/auth.ts
import type {Authenticate} from 'callspec';

export type Ctx = {userId: string};

export const authenticate: Authenticate<Ctx> = async (token, req) => {
    const session = await verifySession(token, req);
    if (!session) return undefined;
    return {userId: session.userId};
};
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

`scope: 'private'` hides a route from exports (SDK, docs, OpenAPI) but does not change the auth gate. See [API reference](api-reference.md).

For richer context from headers and JWT claims, see [Request context](request-context.md).
