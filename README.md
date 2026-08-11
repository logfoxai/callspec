<div align="center">
  <picture>
    <source srcset="assets/callspec-lockup-dark.svg?cb=13" media="(prefers-color-scheme: dark)" />
    <source srcset="assets/callspec-lockup-light.svg?cb=13" media="(prefers-color-scheme: light)" />
    <img src="assets/callspec-lockup-light.svg?cb=13" alt="callspec" />
  </picture>
  <h4 align="center">Stop duct-taping your API stack.<br/>One TypeScript route → typed SDK, docs, OpenAPI, and MCP.</h4>
  <p align="center">
    <a href="https://callspec.logfox.ai"><strong>callspec.logfox.ai</strong></a>
    ·
    <a href="https://callspec.logfox.ai/demo/"><strong>Chirp explorer</strong></a>
  </p>
  <br>
  <p align="center">
  <a href="assets/callspec-flow.svg?cb=7">
    <img src="assets/callspec-flow.svg?cb=7" alt="Callspec flow: define in TypeScript, mountSpec, CLI SDK, OpenAPI export, optional Fern multi-language SDKs" />
  </a>
</p>
</div>

Define your API once with simple TypeScript — methods like `getProductById` with typed inputs, outputs, and errors — and Callspec gives you the whole stack from that one place: the server, a **TypeScript SDK** you use in your own app or ship to consumers, shared types (and optional form validators), docs, MCP tools, and **OpenAPI 3.1**.

On the frontend you call `api.getProductById({…})` and get a **Result** back — success value or a typed error `code` you can switch on. Same methods, same types, same errors as the server and as agents on MCP. No drift, no hand-rolled client, no guessing which status codes mean what.

- 🧪 **Unit-test the real handler** — `.handler(input, ctx)` — no HTTP, no `req`/`res`, no mocks (unless you use singletons); 100% line/branch/function coverage is realistic
- 🎯 **Result-typed errors** — end-to-end error codes from handler → SDK → OpenAPI → MCP
- 🤖 **MCP from the same routes** — your TypeScript API is also a Cursor/Claude tool server
- ⚡ **RPC functions** — define simple functions like `getProductById`, not REST CRUD
- 🧩 **TypeScript SDK** — use it in your frontend or publish it for API consumers
- 📄 **OpenAPI 3.1** — for tooling, gateways, and multi-language generators when you need them
- 📘 **Docs UI** — white-label explorer to try methods and connect MCP clients
- ✅ **Shared types & schemas** — same preds end-to-end; optional `exports` land on generated `schemas`

## Try the demo

**Hosted (browse routes / MCP connect snippets):** [callspec.logfox.ai/demo](https://callspec.logfox.ai/demo/)

**Live try-it + MCP locally:**

```bash
git clone https://github.com/logfoxai/callspec.git
cd callspec && npm install
npm run build && npm run serve:chirp-demo
```

Open [http://127.0.0.1:3456/v1/docs](http://127.0.0.1:3456/v1/docs) — fictional **Chirp API v2**. Bearer token `demo` for authenticated routes and MCP.

## Contents

For coding agents: [Working with Coding Agents](src/content/docs/coding-agents.md) (copy-paste skill + prompts). Skill file: [SKILL.md](skills/callspec/SKILL.md).

- [Getting started](src/content/docs/getting-started.md)
- [Working with Coding Agents](src/content/docs/coding-agents.md)
- [Server layout](src/content/docs/server-layout.md)
- [Unit testing](src/content/docs/unit-testing.md)
- [Single-file server example](src/content/docs/single-file-server-example.md)
- [Authentication](src/content/docs/authentication.md)
- [Request context](src/content/docs/request-context.md)
- [API reference](src/content/docs/api-reference.md)
- [Error handling](src/content/docs/error-handling.md)
- [Builtin errors](src/content/docs/builtin-errors.md)
- [SDK generation](src/content/docs/sdk-generation.md)
- [Client usage](src/content/docs/client-usage.md)
- [Shared validation](src/content/docs/shared-validation.md)
- [Docs UI](src/content/docs/docs-ui.md)
- [Docs UI branding](src/content/docs/docs-ui-branding.md) (theme vars; last-resort CSS / `headerHtml`)
- [Hosting Docs UI (CloudFront / Pages)](src/content/docs/hosting-cloudfront-pages.md)
- [MCP Server](src/content/docs/mcp.md)
- [OpenAPI](src/content/docs/openapi.md)
- [Multi-language SDKs](src/content/docs/multi-language-sdks.md)
- [Development](src/content/docs/development.md)
