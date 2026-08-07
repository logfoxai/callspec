---
title: Complete example
---

Single-file server — routes, `spec()`, and `mountSpec()` in one copy-paste module. Equally valid; split-file layout when you outgrow it: [Server layout](server-layout.md). Auth: [Authentication](authentication.md).

```typescript
import express from 'express';
import {spec, route, err, mountSpec} from 'callspec';
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
    mcp: true,
    resolver: async (input, _ctx) => {
        // input validated and fully typed — return and errors too! 🎉
        const found = products.find((item) => item.id === input.id);
        if (!found) return err.NOT_FOUND();
        return found;
    },
});

export const meta = {
    title: 'My API',
    version: process.env.VERSION ?? '1.0.0',
    intro: 'Product catalog with typed RPC.',
    mcpInstructions: 'Look up products by sku — public in this example.',
};

export const routes = {
    getProductById,
};

export const api = spec({meta, routes});

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

With defaults, `mountSpec` serves `/docs`, `/callspec.json`, `/openapi.json`, and `/mcp` (when any route has `mcp: true`). Use `docsPath` to mount the UI elsewhere; contract paths stay fixed — see [mountSpec](api-reference/mount-spec.md).
