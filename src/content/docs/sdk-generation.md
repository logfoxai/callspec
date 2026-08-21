# SDK generation

The CLI reads **`{mount}/callspec.json`** (mount URL or file path) and writes one TypeScript file: a typed **`ApiClient`**, route types, and a **`schemas`** object of runtyp preds (spec `exports` plus each route’s input/output). Shared form preds: [Shared validation](./shared-validation.md).

```bash
# Live mount
npx callspec http://127.0.0.1:3000/v1 --output src/generated/api.ts

# From a pinned file
npx callspec ./callspec.json --output src/generated/api.ts
```

```typescript
import {ApiClient, schemas, type GetProductByIdInput, type Product} from './generated/api';

const api = new ApiClient({baseUrl: '/v1'});
const checked = schemas.product(form);
if (!checked.isValid) {
    // checked.errors — field → message
}
```

Generated code imports `callspec/client` (browser-safe) and `runtyp` (for `schemas`). Install both in the app that compiles the generated file (`npm i callspec runtyp`). Codegen reads **`callspec.json`**, not OpenAPI.

It generates whatever routes are in the document you hand it. To include `scope: 'private'` methods, point it at a mount (or file) emitted with `visibility: 'all'` — typically your dev/stage server. See [Auth and scope](./api-reference/auth-and-scope.md).

## Pinning for CI (optional)

A live URL is enough when the server is already up in the same pipeline. Pin `callspec.json` when frontend CI should not boot the API, you want contract diffs in PRs, or another repo consumes the file.

```bash
curl -fsS http://127.0.0.1:3000/v1/callspec.json -o callspec.json
```

Or emit without HTTP:

```typescript
import {writeFileSync} from 'fs';
import {emitCallspec} from 'callspec/document';
import {api} from '../server/routes';

writeFileSync(
    'callspec.json',
    JSON.stringify(
        emitCallspec(api.routes, {
            title: api.meta.title ?? 'My API',
            version: api.meta.version ?? '1.0.0',
            basePath: '/v1',
            description: api.meta.intro,
            exports: api.exports,
            visibility: 'all', // include scope: 'private' routes on this file
        }),
        null,
        2,
    ),
);
```

```json
"scripts": {
  "generate:api": "callspec ./callspec.json --output src/generated/api.ts",
  "check:api": "npm run generate:api && git diff --exit-code src/generated/api.ts callspec.json"
}
```

Commit the contract file, the generated SDK, or both — match `check:api` to what you keep in git.
