# Complete example

Copy-paste server with meta branding and all default surfaces.

```typescript
import express from 'express';
import {defineSpec, defineRoute, defineErrors, mountSpec, isRouteFailure, resolverFor, type RouteFailuresFrom} from 'callspec';
import {predicates as p, type Infer} from 'runtyp';

const catalog = new Map([
    ['sku-1', {id: 'sku-1', name: 'Trail Pack 24L', priceCents: 8900}],
    ['sku-2', {id: 'sku-2', name: 'Insulated Bottle', priceCents: 2400}],
]);

const searchErr = defineErrors({
    SEARCH_CRITERIA_REQUIRED: {},
    PRODUCT_NOT_FOUND: {data: p.object({id: p.string()})},
});

const searchProductsRoute = {
    input: p.object({
        id: p.optional(p.string({description: 'Product id (sku)'})),
        keywords: p.optional(p.string({description: 'Search product names'})),
    }),
    output: p.object({
        results: p.array(p.object({id: p.string(), name: p.string(), priceCents: p.number()})),
        count: p.number(),
    }),
    errors: searchErr,
} as const;

type SearchProduct = Infer<typeof searchProductsRoute.output>['results'][number];

function lookupById(id: string): SearchProduct | RouteFailuresFrom<typeof searchErr> {
    const product = catalog.get(id);
    if (!product) return searchErr.PRODUCT_NOT_FOUND({id});
    return product;
}

const searchProductsResolver = resolverFor(searchProductsRoute)(async (input, _ctx) => {
    if (input.id) {
        const product = lookupById(input.id);
        if (isRouteFailure(product)) return product;
        return {results: [product], count: 1};
    }
    const keywords = input.keywords?.trim();
    if (keywords) {
        const needle = keywords.toLowerCase();
        const results = [...catalog.values()].filter((item) => item.name.toLowerCase().includes(needle));
        return {results, count: results.length};
    }
    return searchErr.SEARCH_CRITERIA_REQUIRED();
});

export const meta = {
    title: 'My API',
    version: process.env.VERSION ?? '1.0.0',
    intro: 'Product catalog with typed RPC search.',
    mcpInstructions: 'Search by id or keywords — public in this example.',
};

export const routes = {
    searchProducts: defineRoute({
        ...searchProductsRoute,
        meta: {
            summary: 'Search products',
            description: 'Look up by product id or search by keywords.',
            tags: ['catalog'],
        },
        access: 'public',
        mcp: true,
        handler: searchProductsResolver,
    }),
};

export const api = defineSpec({meta, routes});

const app = express();
const router = express.Router();

router.use(express.json());

mountSpec(router, api);

app.use('/v1', router);

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
    console.log(`RPC:         http://127.0.0.1:${port}/v1/searchProducts`);
    console.log(`Docs:        http://127.0.0.1:${port}/v1/docs`);
    console.log(`Callspec:    http://127.0.0.1:${port}/v1/callspec.json`);
    console.log(`OpenAPI:     http://127.0.0.1:${port}/v1/openapi.json`);
    console.log(`MCP:         http://127.0.0.1:${port}/v1/mcp`);
});
```

With defaults, `mountSpec` serves `/docs`, `/callspec.json`, `/openapi.json`, and `/mcp` (when any route has `mcp: true`). See the [README](../README.md) for per-path overrides.
