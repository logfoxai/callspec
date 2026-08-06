---
layout: home

hero:
  name: Callspec
  text: Simple TypeScript powers your RPC API, SDK, MCP, docs, and OpenAPI spec.
  tagline: Define your API once — get the whole stack with no drift.
  image:
    src: /callspec-flow.svg
    alt: Callspec flow — define in TypeScript, mountSpec, CLI SDK, OpenAPI export
  actions:
    - theme: brand
      text: Get started
      link: /getting-started
    - theme: alt
      text: API reference
      link: /api-reference
    - theme: alt
      text: For agents
      link: /agents

features:
  - icon: ⚡
    title: RPC functions
    details: Define simple functions like getProductById — not REST CRUD.
  - icon: 🧩
    title: TypeScript SDK
    details: Use it in your frontend or publish it for API consumers.
  - icon: 🎯
    title: Result-typed errors
    details: End-to-end error codes from resolver → SDK → OpenAPI → MCP.
  - icon: 📄
    title: OpenAPI 3.1
    details: For gateways, contract tests, and multi-language generators.
  - icon: 🤖
    title: MCP
    details: Same methods as your SDK — same auth and validation.
  - icon: 📘
    title: Docs UI
    details: White-label explorer to try RPCs and connect MCP clients.
---

## Try the live API demo

Explore the **interactive** docs UI, MCP connect flow, and sample **Chirp API** — clone the repo (not available via `npm i callspec` alone):

```bash
git clone https://github.com/logfoxai/callspec.git
cd callspec && npm install
npm run build && npm run dev:docs
```

Open [http://127.0.0.1:3456/v1/docs](http://127.0.0.1:3456/v1/docs) — Bearer token `demo` for authenticated routes and MCP.

This site is the **guide** (markdown). The demo above is Callspec's **built-in API explorer** on a running server.
