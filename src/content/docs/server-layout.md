# Server layout

Callspec doesn't care about your folders. A single file is fine for demos — see [Single-file server example](./single-file-server-example.md). When the API grows (or you're past a toy), **split** so each route, shared pred, and the registry stay easy to find and test.

`mountSpec` serves `{mount}/callspec.json` at runtime. Pinning that file in git is optional — [SDK generation](./sdk-generation.md).

## Best practice (split layout)

1. **One route per file** — `src/routes/getProductById.ts` exports `getProductById = route({ … })`. Co-locate `getProductById.spec.ts`.
2. **Keep `handler` inline** in that `route({ … })` call so `input` / success return types flow from the preds — avoid extracting the handler + `HandlerFor` unless you have a real reason ([Handlers](./api-reference/handlers.md)).
3. **Shared domain preds** live under `src/schemas/` and are imported by routes (`output: product`). Infer TS types with `Infer<typeof product>` when local data (e.g. fixtures) should match. Route-only wire shapes (`{ id }`, filters) stay in the route file.
4. **`spec.ts` is only the registry** — `spec({ meta, routes, exports?, authenticate? })`. Import named routes; don't redefine them there.
5. **`index.ts` only mounts** — Express + `mountSpec`. No route logic.

Test handlers with `.handler(input, ctx)` — no HTTP. See [Unit testing](./unit-testing.md).

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

The generated `ApiClient` lives in the **consumer** (`npx callspec <mount> --output …`), not in this tree.

## What goes where

| Kind | Put it | Example |
|------|--------|---------|
| Shared domain entity | One schema module, imported by routes | `Product`, `User` |
| Route-only wire shape | In the route file | `{ id }` input; list wrappers |
| Frontend form/filter pred | Schema module + `spec({ exports })` | `product` — [Shared validation](./shared-validation.md) |
| Wired route | Own file under `routes/`, via `route()` | `export const getProductById = route({…})` |
| Registry | `spec.ts` only | `spec({ routes: { getProductById } })` |

Share domain preds. Keep ID/filter/pagination shapes with the route unless they're reused.

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

// handler stays inline — types flow from the preds
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

router.use(express.json());
mountSpec(router, api);
app.use('/v1', router);

app.listen(3000);
```

Auth: [Authentication](./authentication.md). Default mount URLs: [mountSpec](./api-reference/mount-spec.md).
