# Server layout

Typical split-file project — one `route()` export per file, input/output preds colocated with that route, a single `spec()` registry, optional auth and `exports`:

```text
my-api/
├── server/
│   ├── index.ts              # Express app — mountSpec on /v1
│   ├── routes.ts             # spec({ meta, routes, exports?, authenticate? })
│   ├── auth.ts               # optional — Authenticate<Ctx> (see Authentication)
│   └── routes/
│       ├── getProductById.ts # route + its input/output preds
│       └── listProducts.ts
├── src/
│   └── generated/
│       └── api.ts            # npx callspec → ApiClient
├── callspec.json             # optional — pinned contract for CI
└── package.json
```

Unit-test resolvers directly — `getProductById.resolver(input, ctx)` — no HTTP.

## Route files

Keep each route's **input and output preds in the same file** as the route — not in a shared schemas folder.

```typescript
// server/routes/getProductById.ts
import {route, err} from 'callspec';
import {predicates as p} from 'runtyp';

const product = p.object({
    id: p.string(),
    name: p.string(),
    priceCents: p.number(),
});

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

const product = p.object({
    id: p.string(),
    name: p.string(),
    priceCents: p.number(),
});

export const listProducts = route({
    input: p.object({}),
    output: p.object({items: p.array(product), count: p.number()}),
    meta: {summary: 'List products', tags: ['catalog']},
    auth: 'none',
    resolver: async () => ({
        items: [{id: 'sku-1', name: 'Widget', priceCents: 999}],
        count: 1,
    }),
});
```

When two routes share the same entity shape, import the pred from the route that owns it (or extract a small module next to those routes). Do not centralize route I/O in a top-level `schemas/` file.

## Exports (optional)

`spec({ exports })` is for preds the **frontend** should import (forms, filters) — separate from wire `input` / `output`. Register them in `routes.ts`; the pred can live in a route file and be re-exported, or in a dedicated file only when several routes contribute to the same export surface. See [Shared validation](shared-validation.md).

## Registry and entrypoint

```typescript
// server/routes.ts
import {spec} from 'callspec';
import {getProductById} from './routes/getProductById';
import {listProducts} from './routes/listProducts';

export const api = spec({
    meta: {title: 'My API', version: '1.0.0', intro: 'Product catalog with typed RPC.'},
    routes: {getProductById, listProducts},
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

## Mounted surfaces

| Surface | URL |
|---------|-----|
| Docs UI | `http://127.0.0.1:3000/v1/docs` |
| Contract | `http://127.0.0.1:3000/v1/callspec.json` |
| OpenAPI | `http://127.0.0.1:3000/v1/openapi.json` |
| RPC | `POST http://127.0.0.1:3000/v1/getProductById` |
| MCP | `http://127.0.0.1:3000/v1/mcp` |

Bearer routes and `authenticate`: [Authentication](authentication.md).

Single-file alternative: [Complete example](complete-example.md).
