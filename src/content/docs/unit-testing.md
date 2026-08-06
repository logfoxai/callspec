---
title: Unit testing
---

# Unit testing

Test route **business logic** without HTTP, Express, or `mountSpec`. Each wired route exposes the same handler production uses at **`.resolver(input, ctx)`** — typed input in, success value or `RouteFailure` out.

Split-file layout makes this natural: one route module, one test file. See [Server layout](server-layout.md).

Examples use [kizu](https://github.com/mhweiner/kizu) — same runner callspec uses (`test(name, async (assert) => …)`).

## Basic resolver test

```typescript
// server/routes/getProductById.spec.ts
import {test} from 'kizu';
import {isRouteFailure} from 'callspec';
import {getProductById} from './getProductById';

test('getProductById: NOT_FOUND for unknown sku', async (assert) => {

    const result = await getProductById.resolver({id: 'missing'}, undefined);

    assert.equal(isRouteFailure(result), true);
    assert.equal(isRouteFailure(result) && result.code, 'NOT_FOUND');

});

test('getProductById: returns product', async (assert) => {

    const result = await getProductById.resolver({id: 'sku-1'}, undefined);

    assert.equal(isRouteFailure(result), false);
    assert.equal(result, {id: 'sku-1', name: 'Widget', priceCents: 999});

});
```

Use `isRouteFailure` from `callspec` to narrow failures vs success before reading `code` or `data`.

## Domain errors

Resolvers return failures with `return err.NOT_FOUND()` / `return registerErr.SOME_CODE({ … })` — not throws. Assert on `code` (and `data` when present):

```typescript
import {test} from 'kizu';
import {isRouteFailure} from 'callspec';
import {createUser} from './createUser';

test('createUser: USER_EXISTS when email taken', async (assert) => {

    const result = await createUser.resolver({email: 'taken@example.com'}, undefined);

    assert.equal(isRouteFailure(result), true);
    assert.equal(isRouteFailure(result) && result.code, 'USER_EXISTS');

});
```

See [Error handling](error-handling.md) for the full contract.

## Testing with context

Pass a fake **`ctx`** as the second argument — same shape `authenticate` would return. No Bearer token, no Express `req`:

```typescript
import {test} from 'kizu';
import type {Ctx} from '../auth';
import {listOrders} from './listOrders';

test('listOrders: scopes to tenant', async (assert) => {

    const orders = await listOrders.resolver(
        {status: 'open'},
        {userId: 'user_1', tenantId: 'acme'} satisfies Ctx,
    );

    assert.equal(isRouteFailure(orders), false);
    // …

});
```

Details: [Request context](request-context.md).

Input validation, Bearer auth, and response serialization live outside the resolver — `mountSpec` and MCP handle those. Your resolver focuses on domain logic; tests call `.resolver` with typed input and optional `ctx`. Use HTTP tests when you need the full stack.

## Suggested layout

```text
server/routes/
├── getProductById.ts
├── getProductById.spec.ts
├── listProducts.ts
└── listProducts.spec.ts
```

Colocate tests with routes, or use a `__tests__/` folder — Callspec does not prescribe either. Export the wired route from the route module so tests can import it.

## Running tests

```bash
npx kizu -f 'server/**/*.spec.ts'
```

Add kizu to devDependencies and wire a `"test"` script in your app — callspec itself uses `c8 kizu -f 'src/**/*.spec.ts'` for coverage.
