# Guide

Beyond the [Getting started](../README.md#getting-started) happy path — full server layout, committed contracts, CI codegen, and frontend usage.

## Full backend example

Same `searchProducts` route — split across files. Single-file copy-paste: [complete-example.md](complete-example.md).

```typescript
// server/routes/searchProducts.ts
import {defineRoute, defineErrors} from 'callspec';
import {predicates as p} from 'runtyp';

const catalog = new Map([
    ['sku-1', {id: 'sku-1', name: 'Trail Pack 24L', priceCents: 8900}],
    ['sku-2', {id: 'sku-2', name: 'Insulated Bottle', priceCents: 2400}],
]);

const searchErr = defineErrors({
    SEARCH_CRITERIA_REQUIRED: {},
    PRODUCT_NOT_FOUND: {data: p.object({id: p.string()})},
});

export const searchProducts = defineRoute({
    input: p.object({
        id: p.optional(p.string()),
        keywords: p.optional(p.string()),
    }),
    output: p.object({
        results: p.array(p.object({id: p.string(), name: p.string(), priceCents: p.number()})),
        count: p.number(),
    }),
    errors: searchErr,
    meta: {
        summary: 'Search products',
        description: 'Look up by product id or search by keywords.',
        tags: ['catalog'],
    },
    access: 'public',
    mcp: true,
    handler: async (input, _ctx) => {
        if (input.id) {
            const product = catalog.get(input.id);
            if (!product) return searchErr.PRODUCT_NOT_FOUND({id: input.id});
            return {results: [product], count: 1};
        }
        const keywords = input.keywords?.trim();
        if (keywords) {
            const needle = keywords.toLowerCase();
            const results = [...catalog.values()].filter((item) => item.name.toLowerCase().includes(needle));
            return {results, count: results.length};
        }
        return searchErr.SEARCH_CRITERIA_REQUIRED();
    },
});
```

```typescript
// server/routes.ts
import {defineSpec} from 'callspec';
import {searchProducts} from './routes/searchProducts';

export const api = defineSpec({
    meta: {title: 'My API', version: '1.0.0', intro: 'Product catalog with typed RPC search.'},
    routes: {searchProducts},
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

| Surface | URL |
|---------|-----|
| Docs UI | `http://127.0.0.1:3000/v1/docs` |
| Contract | `http://127.0.0.1:3000/v1/callspec.json` |
| OpenAPI | `http://127.0.0.1:3000/v1/openapi.json` |
| RPC | `POST http://127.0.0.1:3000/v1/searchProducts` |
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
// src/app/searchProducts.ts
import {
    ApiClient,
    type SearchProductsInput,
    type SearchProductsOutput,
    type SearchProductsResult,
} from '../generated/api';

const api = new ApiClient({
    baseUrl: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3000/v1',
});

export async function searchProducts(keywords: string): Promise<SearchProductsOutput['results']> {
    const input: SearchProductsInput = {keywords};
    const result: SearchProductsResult = await api.searchProducts(input);

    if (!result.ok) {
        if (result.code === 'SEARCH_CRITERIA_REQUIRED') {
            throw new Error('Enter keywords or a product id');
        }
        if (result.code === 'PRODUCT_NOT_FOUND') {
            throw new Error(`Unknown product ${result.data.id}`);
        }
        if (result.code === 'VALIDATION_ERROR') {
            throw new Error(`Invalid input: ${JSON.stringify(result.data)}`);
        }
        throw new Error(result.code);
    }

    return result.value.results;
}
```

```tsx
// src/components/ProductSearch.tsx
import {useState} from 'react';
import type {SearchProductsOutputResultsItem} from '../generated/api';
import {searchProducts} from '../app/searchProducts';

export function ProductSearch() {
    const [keywords, setKeywords] = useState('');
    const [results, setResults] = useState<SearchProductsOutputResultsItem[]>([]);

    async function onSearch() {
        setResults(await searchProducts(keywords));
    }

    return (
        <>
            <input value={keywords} onChange={(e) => setKeywords(e.target.value)} />
            <button type="button" onClick={() => void onSearch()}>Search</button>
            <ul>{results.map((p) => <li key={p.id}>{p.name} — ${(p.priceCents / 100).toFixed(2)}</li>)}</ul>
        </>
    );
}
```

Same methods, same types, same error codes as the server and MCP tools — no hand-rolled `fetch`.

## Shared validation (backend + frontend)

Routes declare wire validation once. Codegen gives the frontend the same **types** (and, with `exports`, **named runtyp preds**) so forms and RPC stay in sync.

| What | Where it lives | Who uses it |
|------|----------------|-------------|
| RPC methods | `defineSpec({ routes })` | Server handlers + generated `ApiClient` |
| Full request/response shapes | Route `input` / `output` | Server boundary + generated `{Route}Input` types |
| Shared UI slices (filters, domain objects) | `defineSpec({ exports })` | Filter bars, modals — same pred as server ([plan](exports-and-codegen.plan.md)) |
| UI-only fields | Consumer app local | Never in the spec |

Composition inside a route input **does not** auto-export the slice — register preds you want consumers to import under **`exports`**.

Powered by [runtyp](https://github.com/logfoxai/runtyp): preds validate at runtime on the server and serialize to JSON Schema for docs, OpenAPI, MCP, and codegen.
