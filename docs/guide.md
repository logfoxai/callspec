# Guide

Beyond the [Getting started](../README.md#getting-started) happy path — full server layout, committed contracts, CI codegen, and frontend usage.

## Full backend example

Same `getProductById` route — split across files. Single-file copy-paste: [complete-example.md](complete-example.md).

**Route authoring:** declare preds once in a `getProductByIdRoute` object, pass to `resolverFor(…)(async …)` for full IDE autocomplete on input, output, and errors, then spread into `defineRoute`. Domain logic lives in plain functions (e.g. `lookupById` returns a product or `null`); map to route failures in the resolver. See [API reference § Resolvers](api-reference.md#resolvers).

```typescript
// server/routes/getProductById.ts
import {defineRoute, defineErrors, resolverFor} from 'callspec';
import {predicates as p, type Infer} from 'runtyp';
import {isDiscontinued, lookupById} from '../domain/products';

const productErr = defineErrors({
    PRODUCT_NOT_FOUND: {status: 404},
    PRODUCT_DISCONTINUED: {status: 410},
});

const product = p.object({
    id: p.string(),
    name: p.string(),
    priceCents: p.number(),
});

const getProductByIdRoute = {
    input: p.object({id: p.string()}),
    output: product,
    errors: productErr,
} as const;

export type Product = Infer<typeof product>;

const getProductByIdResolver = resolverFor(getProductByIdRoute)(async (input, _ctx) => {
    if (isDiscontinued(input.id)) return productErr.PRODUCT_DISCONTINUED();
    const found = lookupById(input.id);
    if (!found) return productErr.PRODUCT_NOT_FOUND();
    return found;
});

export const getProductById = defineRoute({
    ...getProductByIdRoute,
    meta: {
        summary: 'Get product by ID',
        description: 'Returns a product, PRODUCT_NOT_FOUND, or PRODUCT_DISCONTINUED.',
        tags: ['catalog'],
    },
    auth: 'none',
    mcp: true,
    handler: getProductByIdResolver,
});
```

**Private routes:** share `type Ctx = { … }` with `authenticate`. Annotate the resolver param as `ctx: Ctx` inside `resolverFor(…)(async (input, ctx) => …)`:

```typescript
type Ctx = {userId: string};

const getProfileResolver = resolverFor(getProfileRoute)(async (input, ctx: Ctx) => {
    return {userId: ctx.userId};
});
```

```typescript
// server/routes.ts
import {defineSpec} from 'callspec';
import {getProductById} from './routes/getProductById';

export const api = defineSpec({
    meta: {title: 'My API', version: '1.0.0', intro: 'Product catalog with typed RPC.'},
    routes: {getProductById},
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

const port = 3000;
app.listen(port, () => {
    console.log(`RPC:         http://127.0.0.1:${port}/v1/getProductById`);
    console.log(`Docs:        http://127.0.0.1:${port}/v1/docs`);
    console.log(`Callspec:    http://127.0.0.1:${port}/v1/callspec.json`);
    console.log(`OpenAPI:     http://127.0.0.1:${port}/v1/openapi.json`);
    console.log(`MCP:         http://127.0.0.1:${port}/v1/mcp`);
});
```

| Surface | URL |
|---------|-----|
| Docs UI | `http://127.0.0.1:3000/v1/docs` |
| Contract | `http://127.0.0.1:3000/v1/callspec.json` |
| OpenAPI | `http://127.0.0.1:3000/v1/openapi.json` |
| RPC | `POST http://127.0.0.1:3000/v1/getProductById` |
| MCP | `http://127.0.0.1:3000/v1/mcp` |

`mountSpec` path options: [API reference § mountSpec](api-reference.md#mountspec).

## Writing `callspec.json`

You do **not** need a committed contract — codegen can always use the live URL. To produce a file for CI or offline use:

**From a running server:**

```bash
curl -fsS http://127.0.0.1:3000/v1/callspec.json -o callspec.json
```

**From TypeScript** (same projection `mountSpec` serves):

```typescript
// scripts/write-callspec-json.ts
import {writeFileSync} from 'fs';
import {emitCallspec} from 'callspec/document';
import {api} from '../server/routes';

const basePath = '/v1'; // must match mountSpec in server/index.ts

writeFileSync(
    'callspec.json',
    JSON.stringify(
        emitCallspec(api.routes, {
            title: api.meta.title ?? 'My API',
            version: api.meta.version ?? '1.0.0',
            basePath,
            description: api.meta.intro,
            exports: api.exports,
        }),
        null,
        2,
    ),
);
```

```bash
npx tsx scripts/write-callspec-json.ts
```

## Frontend codegen

The CLI reads **`callspec.json`** (file or URL). The document already contains routes, errors, `info`, and paths — codegen does not take title, version, or basePath.

```bash
# local dev (API running)
npx callspec http://127.0.0.1:3000/v1/callspec.json --output src/generated/api.ts

# CI or offline (committed contract)
npx callspec ./callspec.json --output src/generated/api.ts

# shared runtyp preds for forms (optional)
npx callspec ./callspec.json --output src/generated/validators.ts --validators
```

Commit `callspec.json` and/or generated `api.ts`; fail CI on drift if you regenerate in the pipeline.

```json
"scripts": {
  "generate:api": "callspec ./callspec.json --output src/generated/api.ts"
}
```

The generated file imports only `callspec/client` (browser-safe), exposes one typed method per route (`CallspecRouteResult`), and can be committed with `git diff --exit-code` in CI.

```bash
callspec <source> --output <file> [--class-name ApiClient]
```

## Frontend usage

Every generated method returns a **Result** with exported types per route. See [error-handling.md](error-handling.md) for the full contract.

```typescript
// src/app/getProductById.ts
import {
    ApiClient,
    type GetProductByIdInput,
    type GetProductByIdOutput,
    type GetProductByIdResult,
} from '../generated/api';

const api = new ApiClient({
    baseUrl: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3000/v1',
});

export async function fetchProduct(id: string): Promise<GetProductByIdOutput> {
    const input: GetProductByIdInput = {id};
    const result: GetProductByIdResult = await api.getProductById(input);

    if (!result.ok) {
        if (result.code === 'PRODUCT_NOT_FOUND') {
            throw new Error(`Unknown product ${id}`);
        }
        if (result.code === 'PRODUCT_DISCONTINUED') {
            throw new Error(`Product ${id} is no longer available`);
        }
        if (result.code === 'VALIDATION_ERROR') {
            throw new Error(`Invalid input: ${JSON.stringify(result.data)}`);
        }
        throw new Error(result.code);
    }

    return result.value;
}
```

```tsx
// src/components/ProductView.tsx
import {useState} from 'react';
import type {GetProductByIdOutput} from '../generated/api';
import {fetchProduct} from '../app/getProductById';

export function ProductView() {
    const [productId, setProductId] = useState('sku-1');
    const [product, setProduct] = useState<GetProductByIdOutput | null>(null);

    async function onLoad() {
        setProduct(await fetchProduct(productId));
    }

    return (
        <>
            <input value={productId} onChange={(e) => setProductId(e.target.value)} />
            <button type="button" onClick={() => void onLoad()}>Load</button>
            {product && (
                <p>{product.name} — ${(product.priceCents / 100).toFixed(2)}</p>
            )}
        </>
    );
}
```

Same methods, same types, same error codes as the server and MCP tools — no hand-rolled `fetch`.

## Shared validation (backend + frontend)

Routes declare wire validation once. Codegen gives the frontend the same **types** (and, with `exports`, **named runtyp preds**) so forms and RPC stay in sync.

| What | Where it lives | Who uses it |
|------|----------------|-------------|
| RPC methods | `defineSpec({ routes })` | Server resolvers + generated `ApiClient` |
| Full request/response shapes | Route `input` / `output` | Server boundary + generated `{Route}Input` types |
| Shared UI slices (filters, domain objects) | `defineSpec({ exports })` | Filter bars, modals — same pred as server ([plan](exports-and-codegen.plan.md)) |
| UI-only fields | Consumer app local | Never in the spec |

Composition inside a route input **does not** auto-export the slice — register preds you want consumers to import under **`exports`**.

Powered by [runtyp](https://github.com/logfoxai/runtyp): preds validate at runtime on the server and serialize to JSON Schema for docs, OpenAPI, MCP, and codegen.
