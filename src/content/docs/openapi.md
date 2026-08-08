# OpenAPI

**Quick facts**

| | |
|--|--|
| URL | `{mount}/openapi.json` (fixed path when `docs: true`) |
| Version | OpenAPI 3.1 |
| Source | Same `routes` object as RPC — **not** derived from `callspec.json` |
| Use for | Gateways, mocking, contract tests, multi-lang SDK generators |
| **Not for** | Callspec TypeScript SDK codegen (use `callspec.json`) |
| Omitted | `scope: 'private'` routes; Bearer security auto-derived from `auth` |

**OpenAPI 3.1** at **`/openapi.json`** — a projection from the same `routes` object as your RPC server. RPC methods appear as `POST` paths; errors grouped by HTTP status.

Use for gateways, mocking, contract tests, and any OpenAPI-based tooling. Callspec’s TypeScript SDK still comes from `callspec.json` — see [SDK generation](./sdk-generation.md).

See [Auth and scope](./api-reference/auth-and-scope.md) for `scope` and Bearer behavior.

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

