# Handlers

Pass preds, meta, and `handler` in one `route()` call:

```typescript
import {route, err, type HandlerFor} from 'callspec';
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
    handler: async (input, _ctx) => {
        const found = products.find((item) => item.id === input.id);
        if (!found) return err.NOT_FOUND();
        return found;
    },
});
```

Separate handler binding (optional):

```typescript
const preds = { input, output, meta, auth: 'none' } as const;

const impl: HandlerFor<typeof preds, Ctx> = async (input, _ctx) => {
    return {id: input.id, name: '…', priceCents: 0};
};

export const getProductById = route({...preds, handler: impl});
```

| Export | Purpose |
|--------|---------|
| `route({ …, handler })` | Wired route for `spec`; handler also on `.handler` for tests |
| `HandlerFor<typeof preds, Ctx?>` | Explicit handler type for a separate binding |

Domain-specific errors: `defineErrors()` + `errors:` on the route — see [Error handling](../error-handling.md). Builtins like `err.NOT_FOUND()` work without declaring `errors` — full list: [Builtin errors](../builtin-errors.md).

Private routes: annotate auth context on the handler — `handler: async (input, ctx: Ctx) => …`. See [Authentication](../authentication.md) and [Request context](../request-context.md).

## Testing handlers

Call `.handler(input, ctx)` on the wired route — no HTTP. Full guide: [Unit testing](../unit-testing.md).

```typescript
import {test} from 'kizu';
import {err} from 'callspec';
import {getProductById} from '../routes/getProductById';

test('getProductById: NOT_FOUND', async (assert) => {
    assert.equal(
        await getProductById.handler({id: 'covfefe'}, undefined),
        err.NOT_FOUND(),
    );
});
```

Export the wired route from the route module when tests live in another file.

← [API reference](../api-reference.md)

