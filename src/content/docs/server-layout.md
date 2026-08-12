# Server layout

Callspec doesn't care about your folders. A single file is fine for demos — see [Single-file server example](./single-file-server-example.md). When the API grows (or you're past a toy), **split** so each route, shared pred, and the registry stay easy to find and test.

## Best practice (split layout)

1. **One route per file** — `server/routes/getProductById.ts` exports `getProductById = route({ … })`. Co-locate `getProductById.spec.ts`.
2. **Keep `handler` inline** in that `route({ … })` call so `input` / success return types flow from the preds — avoid extracting the handler + `HandlerFor` unless you have a real reason ([Handlers](./api-reference/handlers.md)).
3. **Shared domain preds** live under `server/schemas/` and are imported by routes (`output: product`). Infer TS types with `Infer<typeof product>` when local data (e.g. fixtures) should match. Route-only wire shapes (`{ id }`, filters) stay in the route file.
4. **`routes.ts` is only the registry** — `spec({ meta, routes, exports?, authenticate? })`. Import named routes; don't redefine them there.
5. **`index.ts` only mounts** — Express + `mountSpec`. No route logic.

Test handlers with `.handler(input, ctx)` — no HTTP. See [Unit testing](./unit-testing.md).

```text
my-api/
├── server/
│   ├── index.ts              # Express app — mountSpec on /v1
│   ├── routes.ts             # spec({ meta, routes, exports?, authenticate? })
│   ├── auth.ts               # optional — Authenticate<Ctx>
│   ├── schemas/
│   │   └── product.ts        # shared domain preds
│   └── routes/
│       ├── getProductById.ts
│       ├── getProductById.spec.ts
│       └── listProducts.ts
├── src/
│   └── generated/
│       └── api.ts            # npx callspec → ApiClient
├── callspec.json             # optional — pinned contract for CI
└── package.json
```

## What goes where

| Kind | Put it | Example |
|------|--------|---------|
| Shared domain entity | One schema module, imported by routes | `Product`, `User` |
| Route-only wire shape | In the route file | `{ id }` input; list wrappers |
| Frontend form/filter pred | Schema module + `spec({ exports })` | `product` — [Shared validation](./shared-validation.md) |
| Wired route | Own file under `routes/`, via `route()` | `export const getProductById = route({…})` |
| Registry | `routes.ts` only | `spec({ routes: { getProductById } })` |

Share domain preds. Keep ID/filter/pagination shapes with the route unless they're reused.

## Shared schemas

```typescript
// server/schemas/product.ts
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

```typescript
// server/routes/getProductById.ts
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

```typescript
// server/routes/listProducts.ts
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

```typescript
// server/routes.ts
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

```typescript
// server/index.ts
import express from 'express';
import {mountSpec} from 'callspec';
import {api} from './routes';

const app = express();
const router = express.Router();

router.use(express.json());
mountSpec(router, api);
app.use('/v1', router);

app.listen(3000);
```

Auth: [Authentication](./authentication.md). Default mount URLs: [mountSpec](./api-reference/mount-spec.md).
