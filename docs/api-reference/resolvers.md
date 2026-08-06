# Resolvers

Pass preds, meta, and `resolver` in one `route()` call:

```typescript
import {route, err, type ResolverFor} from 'callspec';
import {predicates as p} from 'runtyp';

const product = p.object({id: p.string(), name: p.string(), priceCents: p.number()});

const products = [
    {id: 'sku-1', name: 'Widget', priceCents: 999},
    {id: 'sku-2', name: 'Gadget', priceCents: 1299},
];

export const getProductById = route({
    input: p.object({id: p.string()}),
    output: product,
    meta: {summary: 'Get product by ID', tags: ['catalog']},
    auth: 'none',
    mcp: true,
    resolver: async (input, _ctx) => {
        const found = products.find((item) => item.id === input.id);
        if (!found) return err.NOT_FOUND();
        return found;
    },
});
```

Separate resolver binding (optional):

```typescript
const preds = { input, output, meta, auth: 'none' } as const;

const impl: ResolverFor<typeof preds, Ctx> = async (input, _ctx) => {
    return {id: input.id, name: '…', priceCents: 0};
};

export const getProductById = route({...preds, resolver: impl});
```

| Export | Purpose |
|--------|---------|
| `route({ …, resolver })` | Wired route for `spec`; resolver also on `.resolver` for tests |
| `ResolverFor<typeof preds, Ctx?>` | Explicit resolver type for a separate binding |

Domain-specific errors: `defineErrors()` + `errors:` on the route — see [Error handling](../error-handling.md). Builtins like `err.NOT_FOUND()` work without declaring `errors`.

Private routes: annotate auth context on the resolver — `resolver: async (input, ctx: Ctx) => …`. See [Authentication](../authentication.md) and [Request context](../request-context.md).

## Testing resolvers

Call `.resolver(input, ctx)` on the wired route — no HTTP. Full guide: [Unit testing](../unit-testing.md).

```typescript
import {test} from 'kizu';
import {isRouteFailure} from 'callspec';
import {getProductById} from '../routes/getProductById';

test('getProductById: NOT_FOUND', async (assert) => {
    const missing = await getProductById.resolver({id: 'missing'}, undefined);
    assert.equal(isRouteFailure(missing) && missing.code, 'NOT_FOUND');
});
```

Export the wired route from the route module when tests live in another file.

← [API reference](../api-reference.md)
