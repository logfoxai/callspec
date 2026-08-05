# Complete example

Copy-paste server with meta branding and all default surfaces.

```typescript
import express from 'express';
import {defineSpec, defineRoute, defineErrors, mountSpec} from 'callspec';
import {predicates as p} from 'runtyp';

const notes = new Map([
    ['1', {id: '1', title: 'Groceries', body: 'Milk, eggs, bread'}],
]);

const getNoteErr = defineErrors({
    NOTE_NOT_FOUND: {data: p.object({id: p.string()})},
});

export const meta = {
    title: 'My API',
    version: process.env.VERSION ?? '1.0.0',
    intro: 'Notes API with typed RPC.',
};

export const routes = {
    getNote: defineRoute({
        input: p.object({id: p.string({description: 'Note ID'})}),
        output: p.object({
            id: p.string(),
            title: p.string(),
            body: p.string(),
        }),
        errors: getNoteErr,
        meta: {
            summary: 'Get note by ID',
            description: 'Returns a note or NOTE_NOT_FOUND.',
            tags: ['notes'],
        },
        access: 'public',
        handler: async (input) => {
            const note = notes.get(input.id);
            if (!note) return getNoteErr.NOTE_NOT_FOUND({id: input.id});
            return note;
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
    console.log(`RPC:         http://127.0.0.1:${port}/v1/getNote`);
    console.log(`Docs:        http://127.0.0.1:${port}/v1/docs`);
    console.log(`Callspec:    http://127.0.0.1:${port}/v1/callspec.json`);
    console.log(`OpenAPI:     http://127.0.0.1:${port}/v1/openapi.json`);
});
```

With defaults, `mountSpec` serves `/docs`, `/callspec.json`, and `/openapi.json`. See the [README](../README.md) for per-path overrides and MCP.
