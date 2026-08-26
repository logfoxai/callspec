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

It generates whatever routes are in the document you hand it. To include `scope: 'private'` methods, point it at a mount (or file) emitted with `visibility: 'all'` &mdash; typically your dev/stage server. See [Auth and scope](./api-reference/auth-and-scope.md).

## Pinning for CI (optional)

A live URL is enough when the server is already up in the same pipeline. Pin `callspec.json` when frontend CI should not boot the API, you want contract diffs in PRs, or another repo consumes the file.

```bash
curl -fsS http://127.0.0.1:3000/v1/callspec.json -o callspec.json
```

Or emit without HTTP:

```typescript
import {writeFileSync} from 'fs';
import {emitCallspec} from 'callspec/document';
import {api} from '../src/spec';

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

Commit the contract file, the generated SDK, or both &mdash; match `check:api` to what you keep in git. `spec()` remains the source of truth either way.

## Consumer apps

The generated TypeScript file is the SDK. Import from it directly.

**Do**

- `import { ApiClient, schemas, type Issue } from './generated/api'`
- `new ApiClient({ baseUrl: '…', headers: { Authorization: '…' } })`
- `callspec <source> --output src/generated/api.ts` in `package.json` scripts

**Do not**

- `src/api/index.ts` (or any barrel) that re-exports generated types
- Wrapper classes or `createXxxClient()` facades around `ApiClient`
- Duplicate enum/const files for values codegen already exports (`IssueStatus.open`, etc.) — import from generated
- Re-export barrels (`domain/errors/apiErrors.ts` re-exporting service types, `src/api/index.ts`, etc.)
- `unwrapResult` or any helper that hides the `result.ok` check
- Custom Node scripts that shell out to the callspec CLI unless you have a documented, exceptional reason

App-specific wiring (config URL, session bearer token) and error mapping (`Result` &rarr; thrown domain errors) belong in small, named helpers &mdash; not a parallel API module.

## Migrating from express-typed-rpc / shared types packages

Do **not** recreate the old package layout on top of codegen. Point imports at the generated file and delete the old RPC/types deps.

| Before | After |
|--------|-------|
| `import {App} from '@logfoxai/types'` | `import type {App} from './generated/api'` |
| `client<API['createApp']>('createApp', input)` | `const result = await api.createApp(input)` |
| `toResultAsync` + `parseError` | `if (!result.ok) throwRouteFailure(result)` &mdash; [Client usage](./client-usage.md) |
| `IssueStatus.OPEN` from a hand-maintained const object | `IssueStatus.open` from generated (callspec 3.12+) |
| `schemas` via `src/api/validation.ts` | `import {schemas} from './generated/api'` |

**Wrong** &mdash; facades agents often add by mistake:

```
src/api/index.ts         # barrel re-exporting generated types
src/api/enums.ts         # duplicate IssueStatus / LogLevel constants
src/api/unwrapResult.ts  # hides result.ok
src/api/validation.ts    # thin schemas wrapper
scripts/generate-api-client.mjs  # use "callspec … --output" in package.json instead
scripts/patch-callspec-codegen.mjs  # patch node_modules — fix upstream in callspec instead
```

**Right:** `src/generated/api.ts` (codegen) + one small `apiClient.ts` (baseUrl + session bearer only) + `throwRouteFailure` (or `handleFailure`) in a named helper. UI label/icon maps can use generated `type` keys with literals &mdash; no parallel enum module.
