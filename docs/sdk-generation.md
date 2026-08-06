# SDK generation

The CLI reads **`{mount}/callspec.json`** — pass a mount-point URL or a path to the file. The document already contains routes, errors, `info`, and paths.

```bash
# local dev (API running)
npx callspec http://127.0.0.1:3000/v1 --output src/generated/api.ts

# CI or offline (committed contract)
npx callspec ./callspec.json --output src/generated/api.ts

# shared runtyp preds for forms (optional)
npx callspec ./callspec.json --output src/generated/validators.ts --validators

# usage: callspec <source> --output <file> [--class-name ApiClient]
```

Commit `callspec.json` and/or generated `api.ts`; fail CI on drift.

```json
"scripts": {
  "generate:api": "callspec ./callspec.json --output src/generated/api.ts"
}
```

The generated file imports only `callspec/client` (browser-safe) — one typed method per route.

To produce a committed contract for CI, curl the live mount or use `emitCallspec` — see [OpenAPI § Native contract](openapi.md#native-contract-callspecjson).
