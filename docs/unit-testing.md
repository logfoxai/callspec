# Unit testing

Test route **business logic** without HTTP, Express, or `mountSpec`. Each wired route exposes the same handler production uses at **`.resolver(input, ctx)`** — typed input in, success value or `RouteFailure` out.

Split-file layout makes this natural: one route module, one test file. See [Server layout](server-layout.md).

## Basic resolver test

```typescript
// server/routes/getProductById.spec.ts
import {isRouteFailure} from 'callspec';
import {getProductById} from './getProductById';

const ctx = undefined; // public route — see Testing with context

const missing = await getProductById.resolver({id: 'missing'}, ctx);
if (!isRouteFailure(missing) || missing.code !== 'NOT_FOUND') {
    throw new Error('expected NOT_FOUND');
}

const found = await getProductById.resolver({id: 'sku-1'}, ctx);
if (isRouteFailure(found)) {
    throw new Error('expected product');
}
// found is typed as the route output
found.name;
```

Use `isRouteFailure` from `callspec` to narrow failures vs success. Your test runner's assertions work the same way — the example above uses plain throws so it stays runner-agnostic.

## Domain errors

Resolvers return failures with `return err.NOT_FOUND()` / `return registerErr.SOME_CODE({ … })` — not throws. Assert on `code` (and `data` when present):

```typescript
const result = await createUser.resolver({email: 'taken@example.com'}, ctx);

if (!isRouteFailure(result) || result.code !== 'USER_EXISTS') {
    throw new Error('expected USER_EXISTS');
}
```

See [Error handling](error-handling.md) for the full contract.

## Testing with context

Pass a fake **`ctx`** as the second argument — same shape `authenticate` would return. No Bearer token, no Express `req`:

```typescript
import type {Ctx} from '../auth';
import {listOrders} from './listOrders';

const orders = await listOrders.resolver(
    {status: 'open'},
    {userId: 'user_1', tenantId: 'acme'} satisfies Ctx,
);
```

Details: [Request context](request-context.md).

## What `.resolver` skips

Direct `.resolver` calls **do not** run:

| Layer | Production path | Unit test |
|-------|-----------------|-----------|
| Input validation (runtyp) | `mountSpec` / MCP | Skipped — pass typed input |
| Bearer auth gate | Before resolver | Skipped — pass `ctx` yourself or `undefined` |
| Response serialization | After success | Skipped — you get the raw resolver return |

That is intentional: unit tests focus on **domain logic and error codes**. To exercise validation, auth, and HTTP mapping together, hit the mounted API (supertest, `fetch`, etc.) or the docs UI try-it flow.

## Suggested layout

```text
server/routes/
├── getProductById.ts
├── getProductById.spec.ts
├── listProducts.ts
└── listProducts.spec.ts
```

Colocate tests with routes, or use a `__tests__/` folder — Callspec does not prescribe either. Export the wired route from the route module so tests can import it.
