# Unit testing

This is one of the main reasons to use Callspec instead of naked Express or frameworks that bury logic inside HTTP handlers.

Every wired route exposes the **same** function production runs &mdash; **`.handler(input, ctx)`** &mdash; with typed input in and a success value or `RouteFailure` out. You call that handler and assert on the return value. No Express app, no `supertest`, no injecting `req`/`res`/`next`. **No mocks** unless *you* introduced hard-to-reach deps (singletons, ambient globals, etc.).

That makes **100% code coverage** realistic on route modules: line (**statement**), **branch**, and **function** coverage &mdash; ordinary unit tests, not an integration suite bolted on later.

Split-file layout makes this natural: one route module, one test file. See [Server layout](./server-layout.md).

Examples use [kizu](https://github.com/mhweiner/kizu) &mdash; same runner callspec uses (`test(name, async (assert) => …)`).

## Basic handler test

```typescript title="src/routes/getProductById.spec.ts" frame="code"
import {test} from 'kizu';
import {err} from 'callspec';
import {getProductById} from './getProductById';

test('getProductById: NOT_FOUND for unknown sku', async (assert) => {
    assert.equal(
        await getProductById.handler({id: 'covfefe'}, undefined),
        err.NOT_FOUND(),
    );
});

test('getProductById: returns product', async (assert) => {
    assert.equal(
        await getProductById.handler({id: 'sku-1'}, undefined),
        {id: 'sku-1', name: 'Widget', priceCents: 999},
    );
});
```

Compare the handler result directly to `err.CODE()` or the success value &mdash; same objects production returns.

## Domain errors

Handlers return failures with `return err.NOT_FOUND()` / `return registerErr.SOME_CODE({ … })` &mdash; not throws. Assert against the same failer:

```typescript
import {test} from 'kizu';
import {createUser, registerErr} from './createUser';

test('createUser: USER_EXISTS when email taken', async (assert) => {
    assert.equal(
        await createUser.handler({email: 'taken@example.com'}, undefined),
        registerErr.USER_EXISTS({email: 'taken@example.com'}),
    );
});
```

See [Error handling](./error-handling.md) for the full contract.

## Testing with context

Pass a fake **`ctx`** as the second argument &mdash; same shape `authenticate` would return. No Bearer token, no Express `req`:

```typescript
import {test} from 'kizu';
import type {Ctx} from '../auth';
import {listOrders} from './listOrders';

test('listOrders: scopes to tenant', async (assert) => {
    const orders = await listOrders.handler(
        {status: 'open'},
        {userId: 'user_1', tenantId: 'acme'} satisfies Ctx,
    );

    assert.equal(orders, [/* … */]);
});
```

Details: [Request context](./request-context.md).

Input validation, Bearer auth, and response serialization live outside the handler &mdash; `mountSpec` and MCP handle those. Your handler focuses on domain logic; tests call `.handler` with typed input and optional `ctx`. Use HTTP tests when you need the full stack.

## Suggested layout

```text
src/routes/
├── getProductById.ts
├── getProductById.spec.ts
├── listProducts.ts
└── listProducts.spec.ts
```

Colocate tests with routes, or use a `__tests__/` folder &mdash; Callspec does not prescribe either. Export the wired route from the route module so tests can import it.

## Running tests

```bash
npx kizu -f 'src/**/*.spec.ts'
```

Add kizu to devDependencies and wire a `"test"` script in your app &mdash; callspec itself uses `c8 kizu -f 'src/**/*.spec.ts'` for coverage.
