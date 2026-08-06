<div align="center">
  <picture>
    <source srcset="assets/callspec-lockup-dark.svg?cb=4" media="(prefers-color-scheme: dark)" />
    <source srcset="assets/callspec-lockup-light.svg?cb=4" media="(prefers-color-scheme: light)" />
    <img src="assets/callspec-lockup-light.svg?cb=4" alt="callspec" />
  </picture>
  <h3 align="center">Simple TypeScript powers your RPC API, SDK, MCP, docs, and OpenAPI spec.</h3>
  <br>
  <p align="center">
  <a href="assets/callspec-flow.svg?cb=5">
    <img src="assets/callspec-flow.svg?cb=5" alt="Callspec flow: define in TypeScript, mountSpec, CLI SDK, OpenAPI export, optional Fern multi-language SDKs" />
  </a>
</p>
</div>

Define your API once with simple TypeScript — methods like `getProductById` with typed inputs, outputs, and errors — and Callspec gives you the whole stack from that one place: the server, a **TypeScript SDK** you use in your own app or ship to consumers, shared types (and optional form validators), docs, MCP tools, and **OpenAPI 3.1**.

On the frontend you call `api.getProductById({…})` and get a **Result** back — success value or a typed error `code` you can switch on. Same methods, same types, same errors as the server and as agents on MCP. No drift, no hand-rolled client, no guessing which status codes mean what.

- ⚡ **RPC functions** — define simple functions like `getProductById`, not REST CRUD
- 🧩 **TypeScript SDK** — use it in your frontend or publish it for API consumers
- 🎯 **Result-typed errors** — end-to-end error codes from resolver → SDK → OpenAPI → MCP
- 📄 **OpenAPI 3.1** — for tooling, gateways, and multi-language generators when you need them
- 🤖 **MCP** — same methods as your SDK, same auth and validation
- 📘 **Docs UI** — white-label explorer to try methods and connect MCP clients
- ✅ **Shared types & validators** — same preds end-to-end; optional `exports` + `--validators` for forms

## Documentation

Topic guides live in **[`docs/`](docs/guide.md)** — one file per topic for easier reading (humans and agents).

**Start here:** [Getting started](docs/getting-started.md) — install, define a route, mount, generate the SDK, call from your app.

| | |
|---|---|
| [Guide index](docs/guide.md) | Full table of contents |
| [Server layout](docs/server-layout.md) | Split-file project structure |
| [API reference](docs/api-reference.md) | `route`, `spec`, `mountSpec`, scope, testing |
| [Error handling](docs/error-handling.md) | Result contract, builtins, domain errors |
| [Callspec + Fern](docs/using-fern-with-callspec.md) | Public multi-lang SDKs and docs alongside Callspec |

## Development

```bash
npm run validate   # build, lint, knip, typecheck:routes, test + coverage
npm run dev:docs   # Chirp demo API + callspec UI at :3456/v1/docs
```

Contributing and support: [Development](docs/development.md).
