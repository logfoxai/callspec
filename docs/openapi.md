# OpenAPI

**OpenAPI 3.1** at **`/openapi.json`** is a parallel projection from the same `routes` object (not derived from `callspec.json`). RPC methods appear as `POST` paths; errors grouped by HTTP status. Use for gateways, mocking, and **public DX tools** — e.g. [Fern](using-fern-with-callspec.md) for multi-language SDKs and public docs while Callspec stays the runtime.

## Native contract (`callspec.json`)

Codegen reads **`callspec.json`** (`callspec: "2.0"`) at a fixed path on the mount. `mountSpec` serves it at `/callspec.json`. You can fetch it with curl, or write the same document with `emitCallspec` — no server required.

**Pinning for CI** (committed file, offline codegen, contract diffs): [SDK generation § Pinning callspec.json for CI](sdk-generation.md#pinning-callspecjson-for-ci).

From TypeScript (same projection `mountSpec` serves):

```bash
curl -fsS http://127.0.0.1:3000/v1/callspec.json -o callspec.json
```

```typescript
import {writeFileSync} from 'fs';
import {emitCallspec, emitOpenApi} from 'callspec/document';
import {api} from '../server/routes';

const basePath = '/v1'; // must match Express mount + mountSpec basePath if set

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

`emitOpenApi` and `parseCallspecDocument` are in `callspec/document` for server tooling and tests.

See [SDK generation](sdk-generation.md) for CLI usage.
