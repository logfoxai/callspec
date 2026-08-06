# OpenAPI

**OpenAPI 3.1** at **`/openapi.json`** — a projection from the same `routes` object as your RPC server. RPC methods appear as `POST` paths; errors grouped by HTTP status.

Use for gateways, mocking, contract tests, and **public DX tools** — e.g. [Fern](using-fern-with-callspec.md) for multi-language SDKs and public docs while Callspec stays the runtime.

Bearer security is derived automatically from route `auth`. Private routes (`scope: 'private'`) are omitted — same as other export surfaces. See [API reference § Auth and scope](api-reference.md#auth-and-scope).

## Fetch from a running server

```bash
curl -fsS http://127.0.0.1:3000/v1/openapi.json -o openapi.json
```

## Emit from TypeScript

Same document `mountSpec` serves — no HTTP required:

```typescript
import {writeFileSync} from 'fs';
import {emitOpenApi} from 'callspec/document';
import {api} from '../server/routes';

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

`emitOpenApi` lives in `callspec/document` alongside other document helpers for server tooling and tests.
