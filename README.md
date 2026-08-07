<div align="center">
  <picture>
    <source srcset="assets/callspec-lockup-dark.svg?cb=4" media="(prefers-color-scheme: dark)" />
    <source srcset="assets/callspec-lockup-light.svg?cb=4" media="(prefers-color-scheme: light)" />
    <img src="assets/callspec-lockup-light.svg?cb=4" alt="callspec" />
  </picture>
  <h4 align="center">Write your API once. Get HTTP RPC, SDK, MCP, docs, and OpenAPI spec.</h4>
  <br>
  <p align="center">
  <a href="assets/callspec-flow.svg?cb=5">
    <img src="assets/callspec-flow.svg?cb=5" alt="Callspec flow: define in TypeScript, mountSpec, CLI SDK, OpenAPI export, optional Fern multi-language SDKs" />
  </a>
</p>
</div>

```bash
npm i callspec runtyp express
```

Define routes in TypeScript — Callspec gives you HTTP RPC, a generated SDK, docs UI, MCP, and OpenAPI from one spec.

## Documentation

All guides live in **[`src/content/docs/`](src/content/docs/)**. That folder is the single source: GitHub renders it when you browse the repo; `npm run astro:dev` builds the **same pages** as the guide site (sidebar + search). See [Development](src/content/docs/development.md).

**[Getting started →](src/content/docs/getting-started.md)**

For coding agents: [AGENTS.md](AGENTS.md) → [skills/callspec/SKILL.md](skills/callspec/SKILL.md)

## Try the demo

Explore the docs UI, MCP connect flow, and a sample API — **clone this repo** (not available via `npm i callspec` alone):

```bash
git clone https://github.com/logfoxai/callspec.git
cd callspec && npm install
npm run build && npm run serve:chirp-demo
```

Open [http://127.0.0.1:3456/v1/docs](http://127.0.0.1:3456/v1/docs) — fictional **Chirp API v2**. Bearer token `demo` for authenticated routes and MCP.
