# Single-file server example

A very minimal example Callspec server all in one file &mdash; so you can see the whole model. For a real API, use [Server layout](./server-layout.md).

```typescript
import express from 'express';
import {spec, route, err, mountSpec} from 'callspec';
import {predicates as p} from 'runtyp';

const products = [
    {id: 'sku-1', name: 'Widget', priceCents: 999},
    {id: 'sku-2', name: 'Gadget', priceCents: 1299},
];

const api = spec({
    meta: {title: 'My API', version: '1.0.0'},
    routes: {
        getProductById: route({
            input: p.object({id: p.string()}),
            output: p.object({
                id: p.string(),
                name: p.string(),
                priceCents: p.number(),
            }),
            meta: {summary: 'Get product by ID', tags: ['catalog']},
            auth: 'none',
            mcp: true,
            handler: async (input, _ctx) => {
                const found = products.find((item) => item.id === input.id);
                if (!found) return err.NOT_FOUND();
                return found;
            },
        }),
    },
});

const app = express();
const router = express.Router();
mountSpec(router, api);
app.use('/v1', router);

app.listen(3000, () => {
    console.log('RPC:      http://127.0.0.1:3000/v1/getProductById');
    console.log('Docs:     http://127.0.0.1:3000/v1/docs');
    console.log('Callspec: http://127.0.0.1:3000/v1/callspec.json');
    console.log('OpenAPI:  http://127.0.0.1:3000/v1/openapi.json');
    console.log('MCP:      http://127.0.0.1:3000/v1/mcp');
});
```

`mountSpec` parses JSON on the router. Surfaces and path options: [mountSpec](./api-reference/mount-spec.md).
