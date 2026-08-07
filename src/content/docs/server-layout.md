# Server layout

Recommended split-file layout for a growing API — one `route()` per file, shared domain preds in one place, a single `spec()` registry, optional auth and `exports`. **Or put it all in one file** — routes, `spec()`, and `mountSpec()` together work fine; see [Complete example](./complete-example.md). Callspec doesn't care about folder names; organize however fits your repo.

```text
my-api/
├── server/
│   ├── index.ts              # Express app — mountSpec on /v1
│   ├── routes.ts             # spec({ meta, routes, exports?, authenticate? })
│   ├── auth.ts               # optional — Authenticate<Ctx> (see Authentication)
│   ├── schemas/
│   │   └── product.ts        # shared domain preds (Product, ProductList, …)
│   └── routes/
│       ├── getProductById.ts # route + route-specific wire shapes
│       ├── getProductById.spec.ts
│       └── listProducts.ts
├── src/
│   └── generated/
│       └── api.ts            # npx callspec → ApiClient
├── callspec.json             # optional — pinned contract for CI (see SDK generation)
└── package.json
```

Unit-test resolvers directly — [Unit testing](./unit-testing.md) (`getProductById.resolver(input, ctx)` — no HTTP).

## What goes where

| Pred | Where | Example |
|------|-------|---------|
| **Shared domain entity** | One module, imported by many routes | `Product`, `User`, `Order` |
| **Route-specific wire shape** | In the route file (inline or local const) | `{ id: string }` input for `getProductById`; `{ items, count }` list wrapper |
| **Frontend-named export** | Same module as domain pred, registered in `spec({ exports })` | `product` in `exports` for forms — [Shared validation](./shared-validation.md) |

Share **`Product`** — don't copy-paste the same object pred in every route file. Keep **route-only** input/output slices (IDs, filters, pagination wrappers) with the route unless they're reused elsewhere.

## Shared domain schemas

```typescript
// server/schemas/product.ts
import {predicates as p} from 'runtyp';

export const product = p.object({
    id: p.string(),
    name: p.string(),
    priceCents: p.number(),
});

export const productList = p.object({
    items: p.array(product),
    count: p.number(),
});
```

## Route files

Import shared preds; define wire shapes that belong to this method only:

```typescript
// server/routes/getProductById.ts
import {route, err} from 'callspec';
import {predicates as p} from 'runtyp';
import {product} from '../schemas/product';

const products = [
    {id: 'sku-1', name: 'Widget', priceCents: 999},
    {id: 'sku-2', name: 'Gadget', priceCents: 1299},
];

export const getProductById = route({
    input: p.object({id: p.string()}),
    output: product,
    meta: {summary: 'Get product by ID', tags: ['catalog']},
    auth: 'none',
    resolver: async (input, _ctx) => {
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
    resolver: async () => ({
        items: [{id: 'sku-1', name: 'Widget', priceCents: 999}],
        count: 1,
    }),
});
```

## Exports (optional)

`spec({ exports })` is for preds the **frontend** should import (forms, filters). Often the same shared domain preds — register `product` from `schemas/product.ts`:

```typescript
import {product, productList} from './schemas/product';

export const api = spec({
    meta: { /* … */ },
    routes: {getProductById, listProducts},
    exports: {product, productList},
});
```

See [Shared validation](./shared-validation.md).

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

Bearer routes and `authenticate`: [Authentication](./authentication.md). Default URLs after mount: [mountSpec](./api-reference/mount-spec.md).

