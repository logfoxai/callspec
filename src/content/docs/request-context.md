# Request context

Building on [Authentication](./authentication.md): the handler's second argument is **request context** &mdash; whatever `authenticate(token, req)` returns. It is not part of the RPC input pred; it is injected per request after auth.

Use `req` when context depends on more than the token &mdash; tenant header, tracing ids, etc.

```typescript
import type {Request} from 'express';
import type {Authenticate} from 'callspec';

export type Ctx = {userId: string; tenantId: string};

export const authenticate: Authenticate<Ctx> = async (token, req: Request) => {
    const user = await verifyJwt(token);
    if (!user) return undefined;

    const tenantId = req.headers['x-tenant-id'];
    if (typeof tenantId !== 'string') return undefined;

    return {userId: user.sub, tenantId};
};
```

Annotate `ctx: Ctx` on the handler param. **Public routes** (`auth: 'none'`): `ctx` is normally `undefined`; if the client sends `Authorization: Bearer …` and you defined `authenticate`, context is still resolved.

## Testing

No HTTP, no Express:

```typescript
const orders = await listOrders.handler({status: 'open'}, {
    userId: 'user_1',
    tenantId: 'acme',
});
```

See [Unit testing](./unit-testing.md).

