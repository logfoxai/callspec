<div align="center">
  <picture>
    <source srcset="assets/callspec-lockup-light.svg" media="(prefers-color-scheme: light)" />
    <source srcset="assets/callspec-lockup-dark.svg" media="(prefers-color-scheme: dark)" />
    <img src="assets/callspec-lockup-dark.svg" alt="callspec" />
  </picture>

  <p><strong>One registry. HTTP RPC, interactive docs, OpenAPI, MCP, and a typed client.</strong></p>
</div>

One `defineRegistry` powers HTTP RPC, OpenAPI, callsheet docs, MCP tools, and a typed client. Add a route once; it shows up everywhere.

```typescript
import {defineRegistry, defineRoute, mountRegistry, mountMcp, client} from 'callspec';
import {predicates as p} from 'runtyp';

export const api = defineRegistry({
    getPipelines: defineRoute({
        input: getPipelinesInput,
        meta: {
            summary: 'List pipelines',
            description: 'Returns pipelines for a team.',
            tags: ['pipelines'],
        },
        mcp: true,           // → tools/list
        handler: getPipelines,
    }),
});

mountRegistry(app, api, {
    contextResolver: getUserContext,
    docs: {
        openApi: {title: 'My API', version: '1.0.0'},
        // exposeOpenApi: true  → GET /openapi.json
        // exposeUi: true       → GET /docs (callsheet UI)
    },
});

mountMcp(app, api, {path: '/mcp', contextResolver: getUserContext});
```

## Why callspec

| Surface | How you get it |
|---------|----------------|
| **HTTP RPC** | `POST /v1/<methodName>` |
| **Interactive docs** | Built-in **callsheet** UI at `/docs` |
| **OpenAPI 3.1** | `GET /openapi.json` from the same registry |
| **MCP tools** | `mcp: true` on a route → automatic `tools/list` |
| **Typed client** | `client<API['searchLogs']>('searchLogs', input)` |

No second schema. No duplicate handler layer. No separate MCP subprocess.

## Batteries included

### callsheet — interactive docs

Minimal, fast docs UI baked into callspec. Env-gated in production; flip on with `exposeDocs: true` or:

```typescript
docs: {
    openApi: {title: 'Logfox API', version: '1.0.0'},
    exposeOpenApi: true,   // machine-readable spec
    exposeUi: true,        // human-readable /docs
    openApiPath: '/openapi.json',
    uiPath: '/docs',
}
```

Toggle each surface independently — spec only, UI only, both, or neither (`docs: false`).

### Auth

- **`access: 'public'`** — no credentials required
- **`access: 'private'`** (default) — 401 without `contextResolver` result
- Team/role rules stay in your resolver `assert*` helpers

Private gate runs **before** validation so unauthenticated callers never see field-level errors.

### MCP on the same Express process

`mountMcp` at `/mcp` on the same app — not a stdio subprocess. Routes opt in with `mcp: true`.

### runtyp + OpenAPI

Field `{ description }` on runtyp preds flows to JSON Schema → OpenAPI → callsheet. Route-level `meta` (summary, tags) is callspec-only.

## Client

Fetch-only — works in the browser and in Node 18+ (global `fetch`). The `callspec/client` entry has no `http`, `https`, or Express imports, so it is safe in frontend bundles.

**Browser or frontend bundler** — import the client subpath so you do not pull server code:

```typescript
import type {API} from '@logfoxai/my-service';   // InferRegistry<typeof api> from the service package
import {client} from 'callspec/client';

const logs = await client<API['searchLogs']>('searchLogs', {teamId}, {
    endpoint: 'https://api.example.com/v1',
    fetchOptions: {headers: {Authorization: `Bearer ${token}`}},
});
```

**Service package** — export the API type once from your registry:

```typescript
import type {InferRegistry} from 'callspec';

export const api = defineRegistry({ /* ... */ });
export type API = InferRegistry<typeof api>;
```

Responses deserialize ISO date strings back to `Date` on read (`deserializeResponse`).

## Development

```bash
npm run validate   # build server + callsheet UI, lint, test (incl. integration)
```

Integration tests spin up Express in-process and verify OpenAPI, `/docs`, auth, and RPC end-to-end.

## Package layout

```
src/
  defineRoute.ts      # route definition + arity guard
  defineRegistry.ts   # named route map
  executeRoute.ts     # shared HTTP + MCP pipeline
  mountRegistry.ts    # POST routes + openapi + callsheet
  mountMcp.ts         # MCP on Express
  openapi.ts          # OpenAPI 3.1 emitter
  client.ts           # typed fetch client
  callsheet/          # built-in docs UI (bundled to dist/callsheet/ui)
```

Powered by [runtyp](https://github.com/logfoxai/runtyp) for validation.
