---
title: SDK generation
---

# SDK generation

The CLI reads **`{mount}/callspec.json`** — pass a mount-point URL or a path to the file. The document already contains routes, errors, `info`, and paths.

**Default:** generate a typed **`ApiClient`** (`callspec/client`). **`--validators`** is a separate opt-in mode — runtyp preds + `Infer` types from `spec({ exports })`, for forms and shared UI slices. See [Shared validation](shared-validation.md).

```bash
# Live mount (server running) → ApiClient
npx callspec http://127.0.0.1:3000/v1 --output src/generated/api.ts

# From file — pin the contract from the server, then codegen offline or in CI
curl -fsS http://127.0.0.1:3000/v1/callspec.json -o callspec.json
npx callspec ./callspec.json --output src/generated/api.ts

# Optional second pass — only if you use spec.exports
npx callspec ./callspec.json --output src/generated/validators.ts --validators

# usage: callspec <source> --output <file> [--class-name ApiClient] [--validators]
```

The generated file imports only `callspec/client` (browser-safe) — one typed method per route.

## Pinning `callspec.json` for CI

You do **not** need a committed `callspec.json` — `npx callspec http://…/v1` fetches the live contract anytime the server is up. Pinning means checking the file into git (or an artifact) and generating the SDK from that path in CI.

### Why pin it

| Use case | What pinning gives you |
|----------|------------------------|
| **Frontend CI without the server** | `callspec ./callspec.json --output …` — no Express boot, no database, no secrets |
| **Reviewable API diffs** | PRs show contract changes (routes, errors, `exports`) separate from implementation |
| **Drift detection** | Regenerate from source → diff against committed `callspec.json` and/or `api.ts`; fail if someone changed routes but not the contract |
| **Split repos** | Frontend (or another team) consumes a committed contract file without hitting your API |
| **Deterministic codegen** | Same input every CI run — not dependent on a deployed/staging URL |

The pinned file is Callspec's native contract (`callspec: "2.0"`) — routes, Result error unions, `exports`, and metadata. OpenAPI is a parallel export; codegen reads **`callspec.json`**, not OpenAPI.

### When live URL is enough

Solo dev or monorepo where backend CI always runs with the app built and codegen hits `http://127.0.0.1:…/v1` (or `emitCallspec` in-process) in the same pipeline. No committed file required.

### Typical workflow

**1. Produce the file** (pick one):

```bash
# Server running locally or in CI after boot
curl -fsS http://127.0.0.1:3000/v1/callspec.json -o callspec.json
```

Or from TypeScript without HTTP:

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
        }),
        null,
        2,
    ),
);
```

**2. Commit** `callspec.json` (and often `src/generated/api.ts` too).

**3. CI generates from the file:**

```json
"scripts": {
  "generate:api": "callspec ./callspec.json --output src/generated/api.ts",
  "check:api": "npm run generate:api && git diff --exit-code src/generated/api.ts callspec.json"
}
```

Adjust `check:api` to match what you commit — some teams only pin `callspec.json` and regenerate `api.ts` every CI run; others commit both and fail on either diff.
