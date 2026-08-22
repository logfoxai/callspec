# Server layout

Callspec doesn't require a particular folder layout. This is the split we recommend — each route, shared pred, and the registry stay easy to find and test.

1. **One route per file** — `src/routes/getProductById.ts` exports `getProductById = route({ … })`. Co-locate `getProductById.spec.ts`.
2. **Keep `handler` inline** in that `route({ … })` call so `input` / success return types flow from the preds — avoid extracting the handler + `HandlerFor` unless you have a real reason ([`route`](./api-reference/route.md#separate-handler-binding)).
3. **Shared domain preds** live under `src/schemas/` and are imported by routes (`output: product`). Infer TS types with `Infer<typeof product>` when local data (e.g. fixtures) should match. Route-only wire shapes (`{ id }`, filters) stay in the route file.
4. **`spec.ts` is only the registry** — `spec({ meta, routes, exports?, authenticate? })`. Import named routes; don't redefine them there.
5. **`index.ts` only mounts** — Express + `mountSpec` (JSON parse is on by default). No route logic.

```text
my-api/
├── src/
│   ├── index.ts              # Express app — mountSpec on /v1
│   ├── spec.ts               # spec({ meta, routes, exports?, authenticate? })
│   ├── auth.ts               # optional — Authenticate<Ctx>
│   ├── schemas/
│   │   └── product.ts        # shared domain preds
│   └── routes/
│       ├── getProductById.ts
│       ├── getProductById.spec.ts
│       └── listProducts.ts
└── package.json
```

## Shared schemas

```typescript title="src/schemas/product.ts" frame="code"
import {predicates as p, Infer} from 'runtyp';

export const product = p.object({
    id: p.string(),
    name: p.string(),
    priceCents: p.number(),
});
export type Product = Infer<typeof product>;

export const productList = p.object({
    items: p.array(product),
    count: p.number(),
});
```

## Routes

```typescript title="src/routes/getProductById.ts" frame="code"
import {route, err} from 'callspec';
import {predicates as p} from 'runtyp';
import {product, type Product} from '../schemas/product';

const products: Product[] = [
    {id: 'sku-1', name: 'Widget', priceCents: 999},
    {id: 'sku-2', name: 'Gadget', priceCents: 1299},
];

export const getProductById = route({
    input: p.object({id: p.string()}),
    output: product,
    meta: {summary: 'Get product by ID', tags: ['catalog']},
    auth: 'none',
    handler: async (input, _ctx) => {
        const found = products.find((item) => item.id === input.id);
        if (!found) return err.NOT_FOUND();
        return found;
    },
});
```

```typescript title="src/routes/listProducts.ts" frame="code"
import {route} from 'callspec';
import {predicates as p} from 'runtyp';
import {productList} from '../schemas/product';

export const listProducts = route({
    input: p.object({}),
    output: productList,
    meta: {summary: 'List products', tags: ['catalog']},
    auth: 'none',
    handler: async () => ({
        items: [{id: 'sku-1', name: 'Widget', priceCents: 999}],
        count: 1,
    }),
});
```

## Registry and entrypoint

```typescript title="src/spec.ts" frame="code"
import {spec} from 'callspec';
import {product, productList} from './schemas/product';
import {getProductById} from './routes/getProductById';
import {listProducts} from './routes/listProducts';

export const api = spec({
    meta: {title: 'My API', version: '1.0.0', intro: 'Product catalog with typed RPC.'},
    routes: {getProductById, listProducts},
    // optional — preds the frontend imports (forms, filters)
    exports: {product, productList},
});
```

```typescript title="src/index.ts" frame="code"
import express from 'express';
import {mountSpec} from 'callspec';
import {api} from './spec';

const app = express();
const router = express.Router();

mountSpec(router, api);
app.use('/v1', router);

app.listen(3000);
```

`mountSpec` parses `application/json` on this router. Pass `{ json: { limit: '1mb' } }` to set a size limit, or `{ json: false }` if the host already parsed the body.

Auth: [Authentication](./authentication.md). Default mount URLs: [mountSpec](./api-reference/mount-spec.md).
