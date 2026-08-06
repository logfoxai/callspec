# Server layout

Typical split-file project — one `route()` export per file, a single `spec()` registry, optional shared schemas and auth:

```text
my-api/
├── server/
│   ├── index.ts              # Express app — mountSpec on /v1
│   ├── routes.ts             # spec({ meta, routes, exports, authenticate? })
│   ├── auth.ts               # optional — Authenticate<Ctx> (see Authentication)
│   ├── schemas/
│   │   └── catalog.ts        # shared runtyp preds → exports / --validators
│   └── routes/
│       ├── getProductById.ts # one route export per RPC method
│       └── listProducts.ts
├── src/
│   └── generated/
│       └── api.ts            # npx callspec → ApiClient
├── callspec.json             # optional — pinned contract for CI
└── package.json
```

Unit-test resolvers directly — `getProductById.resolver(input, ctx)` — no HTTP.

## Shared schemas

Reuse domain preds, not copy-paste per route:

```typescript
// server/schemas/catalog.ts
import {predicates as p} from 'runtyp';

export const product = p.object({
    id: p.string(),
    name: p.string(),
    priceCents: p.number(),
});

export const productIdInput = p.object({id: p.string()});

export const productList = p.object({
    items: p.array(product),
    count: p.number(),
});
```

Pass named preds to `spec({ exports: { product, productList, … } })` when you want them in codegen / `--validators`. See [Shared validation](shared-validation.md).

## Registry and entrypoint

```typescript
// server/routes.ts
import {spec} from 'callspec';
import {product, productList} from './schemas/catalog';
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
