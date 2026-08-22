# OpenAPI

Callspec emits **OpenAPI 3.1** — useful for API gateways, contract tests, mocks, and multi-language SDK/docs tools (e.g. Fern, Kiota).

It is a **projection for the ecosystem**, not the source of truth for Callspec’s TypeScript client. For `npx callspec` / `ApiClient`, use **`callspec.json`**, not OpenAPI.

## When to use which

| Need | Use |
|------|-----|
| TypeScript SDK + Result errors + `schemas` | `callspec.json` → [SDK generation](./sdk-generation.md) |
| Gateway, Postman, Pact, OpenAPI lint | `/openapi.json` or `emitOpenApi` |
| Public multi-lang SDKs / hosted docs | OpenAPI → [multi-language SDKs](./multi-language-sdks.md) (Fern, Kiota, …) |
| Try methods in the browser | [Docs UI](./docs-ui.md) |

## What’s in the document

- Each public RPC method as a `POST` path
- Request/response schemas from route preds
- Errors grouped by HTTP status (builtins + route domain errors)
- Bearer security when `auth: 'bearer'`
- `scope: 'private'` routes omitted unless `visibility: 'all'`

Auth/scope details: [Auth and scope](./api-reference/auth-and-scope.md).

## Fetch from a running server

Served at **`{mount}/openapi.json`** whenever `docs` is enabled (default). Disabled with `mountSpec(router, api, {docs: false})` — same switch as the docs UI and `callspec.json`.

Replace the host (`127.0.0.1`), port (`3000`), and mount (`/v1`) with yours:

```bash
curl -fsS http://127.0.0.1:3000/v1/openapi.json -o openapi.json
```

## Emit without HTTP

Same document `mountSpec` would serve — for CI or offline packaging:

```typescript
import {writeFileSync} from 'fs';
import {emitOpenApi} from 'callspec/document';
import {api} from '../src/spec';

const basePath = '/v1'; // must match Express mount + mountSpec basePath if set

writeFileSync(
    'openapi.json',
    JSON.stringify(
        emitOpenApi(api.routes, {
            title: api.meta.title ?? 'My API',
            version: api.meta.version ?? '1.0.0',
            basePath,
            description: api.meta.intro,
        }),
        null,
        2,
    ),
);
```

`emitOpenApi` is exported from `callspec/document`.

## Related

- [SDK generation](./sdk-generation.md) — TypeScript from `callspec.json`
- [Multi-language SDKs](./multi-language-sdks.md) — OpenAPI → Fern, Kiota, and similar tools
- [Docs UI](./docs-ui.md) — human explorer alongside the JSON exports
