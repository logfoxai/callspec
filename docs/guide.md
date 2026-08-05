# Guide

Beyond the [Getting started](../README.md#getting-started) happy path — full server layout, committed contracts, CI codegen, and frontend usage.

## Full backend example

Same `getNote` route — split across files. Single-file copy-paste: [complete-example.md](complete-example.md).

```typescript
// server/routes/getNote.ts
import {defineRoute, defineErrors} from 'callspec';
import {predicates as p} from 'runtyp';

const notes = new Map([
    ['1', {id: '1', title: 'Groceries', body: 'Milk, eggs, bread'}],
]);

const getNoteErr = defineErrors({
    NOTE_NOT_FOUND: {data: p.object({id: p.string()})},
});

export const getNote = defineRoute({
    input: p.object({id: p.string()}),
    output: p.object({id: p.string(), title: p.string(), body: p.string()}),
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
});
```

```typescript
// server/routes.ts
import {defineSpec} from 'callspec';
import {getNote} from './routes/getNote';

export const api = defineSpec({
    meta: {title: 'My API', version: '1.0.0', intro: 'Notes API with typed RPC.'},
    routes: {getNote},
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

mountSpec(router, api, {basePath: '/v1'});

app.use('/v1', router);
app.listen(3000);
```

| Surface | URL |
|---------|-----|
| Docs UI | `http://127.0.0.1:3000/v1/docs` |
| Contract | `http://127.0.0.1:3000/v1/callspec.json` |
| OpenAPI | `http://127.0.0.1:3000/v1/openapi.json` |
| RPC | `POST http://127.0.0.1:3000/v1/getNote` |
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

Every generated method returns a **Result** — branch on `ok` and `code`. See [error-handling.md](error-handling.md) for the full contract.

```typescript
// src/app/getNote.ts
import {ApiClient} from '../generated/api';

const api = new ApiClient({
    baseUrl: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3000/v1',
});

export async function fetchNote(id: string) {
    const result = await api.getNote({id});

    if (!result.ok) {
        if (result.code === 'NOTE_NOT_FOUND') {
            throw new Error(`No note ${result.data.id}`);
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
// src/components/NoteView.tsx
import {useState} from 'react';
import {fetchNote} from '../app/getNote';

export function NoteView() {
    const [note, setNote] = useState<{title: string; body: string} | null>(null);

    async function onLoad() {
        setNote(await fetchNote('1'));
    }

    return (
        <>
            <button type="button" onClick={() => void onLoad()}>Load note</button>
            {note && (
                <>
                    <h2>{note.title}</h2>
                    <p>{note.body}</p>
                </>
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
| RPC methods | `defineSpec({ routes })` | Server handlers + generated `ApiClient` |
| Full request/response shapes | Route `input` / `output` | Server boundary + generated `{Route}Input` types |
| Shared UI slices (filters, domain objects) | `defineSpec({ exports })` | Filter bars, modals — same pred as server ([plan](exports-and-codegen.plan.md)) |
| UI-only fields | Consumer app local | Never in the spec |

Composition inside a route input **does not** auto-export the slice — register preds you want consumers to import under **`exports`**.

Powered by [runtyp](https://github.com/logfoxai/runtyp): preds validate at runtime on the server and serialize to JSON Schema for docs, OpenAPI, MCP, and codegen.
