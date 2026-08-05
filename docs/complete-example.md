# Complete example

Copy-paste server with meta branding and all default surfaces. Assumes `domain/products.ts` exports `lookupById(id)` — product or `null`; retired skus have `discontinued: true`.

```typescript
import express from 'express';
import {defineSpec, defineRouteContract, defineErrors, err, mountSpec, resolveRoute, resolverFor} from 'callspec';
import {predicates as p} from 'runtyp';
import {lookupById} from './domain/products';

const productErr = defineErrors({
    PRODUCT_DISCONTINUED: {},
});

const product = p.object({
    id: p.string(),
    name: p.string(),
    priceCents: p.number(),
});

const getProductByIdContract = defineRouteContract({
    input: p.object({id: p.string()}),
    output: product,
    errors: productErr,
    meta: {summary: 'Get product by ID', tags: ['catalog']},
    auth: 'none',
    mcp: true,
});

const getProductByIdResolver = resolverFor(getProductByIdContract)(async (input, _ctx) => {
    const found = lookupById(input.id);
    if (!found) return err.NOT_FOUND();
    if (found.discontinued) return productErr.PRODUCT_DISCONTINUED();
    return found;
});

export {getProductByIdResolver};

export const meta = {
    title: 'My API',
    version: process.env.VERSION ?? '1.0.0',
    intro: 'Product catalog with typed RPC.',
    mcpInstructions: 'Look up products by sku — public in this example.',
};

export const routes = {
    getProductById: resolveRoute(getProductByIdContract, getProductByIdResolver),
};

export const api = defineSpec({meta, routes});

const app = express();
const router = express.Router();

router.use(express.json());

mountSpec(router, api);

app.use('/v1', router);

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
    console.log(`RPC:         http://127.0.0.1:${port}/v1/getProductById`);
    console.log(`Docs:        http://127.0.0.1:${port}/v1/docs`);
    console.log(`Callspec:    http://127.0.0.1:${port}/v1/callspec.json`);
    console.log(`OpenAPI:     http://127.0.0.1:${port}/v1/openapi.json`);
    console.log(`MCP:         http://127.0.0.1:${port}/v1/mcp`);
});
```

With defaults, `mountSpec` serves `/docs`, `/callspec.json`, `/openapi.json`, and `/mcp` (when any route has `mcp: true`). See the [README](../README.md) for per-path overrides.
