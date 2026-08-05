# Complete example

Copy-paste server with meta branding and all default surfaces.

```typescript
import express from 'express';
import {defineSpec, defineRoute, defineErrors, mountSpec} from 'callspec';
import {predicates as p} from 'runtyp';

const echoErr = defineErrors({
    MESSAGE_EMPTY: {},
});

export const meta = {
    title: 'My API',
    version: process.env.VERSION ?? '1.0.0',
    intro: 'Minimal typed RPC surface.',
};

export const routes = {
    echo: defineRoute({
        input: p.object({message: p.string({description: 'Message to echo back'})}),
        output: p.object({echo: p.string()}),
        errors: echoErr,
        meta: {
            summary: 'Echo a message',
            description: 'Returns the input message.',
            tags: ['demo'],
        },
        access: 'public',
        handler: async (input) => {
            if (!input.message.trim()) return echoErr.MESSAGE_EMPTY();
            return {echo: input.message};
        },
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
    console.log(`RPC:         http://127.0.0.1:${port}/v1/echo`);
    console.log(`Docs:        http://127.0.0.1:${port}/v1/docs`);
    console.log(`Callspec:    http://127.0.0.1:${port}/v1/callspec.json`);
    console.log(`OpenAPI:     http://127.0.0.1:${port}/v1/openapi.json`);
});
```

With defaults, `mountSpec` serves `/docs`, `/callspec.json`, and `/openapi.json`. See the [README](../README.md) for per-path overrides and MCP.
