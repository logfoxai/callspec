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

## Try the demo

Explore the docs UI, MCP connect flow, and a sample API — **clone this repo** (not available via `npm i callspec` alone):

```bash
git clone https://github.com/logfoxai/callspec.git
cd callspec && npm install
npm run build && npm run dev:docs
```

Open [http://127.0.0.1:3456/v1/docs](http://127.0.0.1:3456/v1/docs) — fictional **Chirp API v2**. Bearer token `demo` for authenticated routes and MCP.

## Contents

For coding agents: [AGENTS.md](AGENTS.md) · [llms.txt](llms.txt)

- [Getting started](docs/getting-started.md)
- [Server layout](docs/server-layout.md)
- [Unit testing](docs/unit-testing.md)
- [Complete example](docs/complete-example.md)
- [Authentication](docs/authentication.md)
- [Request context](docs/request-context.md)
- [API reference](docs/api-reference.md)
- [Error handling](docs/error-handling.md)
- [SDK generation](docs/sdk-generation.md)
- [Client usage](docs/client-usage.md)
- [Shared validation](docs/shared-validation.md)
- [Docs UI](docs/docs-ui.md)
- [MCP](docs/mcp.md)
- [OpenAPI](docs/openapi.md)
- [Callspec + Fern](docs/using-fern-with-callspec.md)
- [Development](docs/development.md)
