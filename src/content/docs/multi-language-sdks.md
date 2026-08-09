# Multi-language SDKs

Callspec’s own TypeScript client is generated from **`callspec.json`** ([SDK generation](./sdk-generation.md)). For **other languages**, export OpenAPI and point any OpenAPI-compatible tool at it.

## Export OpenAPI

From a running server (swap host, **port**, and mount for yours — `3000` and `/v1` match the getting-started example):

```bash
curl -fsS http://127.0.0.1:3000/v1/openapi.json -o openapi.json
```

Or emit offline with `emitOpenApi` — see [OpenAPI](./openapi.md).

## Generators

Feed that `openapi.json` into the generator you prefer. Two common options:

| Tool | Notes |
|------|--------|
| [Fern](https://buildwithfern.com/) | Multi-language SDKs and hosted API docs |
| [Microsoft Kiota](https://learn.microsoft.com/en-us/openapi/kiota/) | Open-source clients from OpenAPI (C#, Go, Java, Python, TypeScript, …) |

Keep Callspec for your TypeScript app (Result-typed `ApiClient`, MCP, docs UI). Use Fern, Kiota, or similar when you need SDKs or docs outside that stack.

## Related

- [OpenAPI](./openapi.md) — what’s in `/openapi.json` and how to emit it
- [SDK generation](./sdk-generation.md) — TypeScript from `callspec.json`
