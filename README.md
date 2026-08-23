<div align="center">
  <picture>
    <source srcset="assets/callspec-lockup-dark.svg?cb=14" media="(prefers-color-scheme: dark)" />
    <source srcset="assets/callspec-lockup-light.svg?cb=14" media="(prefers-color-scheme: light)" />
    <img src="assets/callspec-lockup-light.svg?cb=14" width="200" alt="Callspec" />
  </picture>
  <h3 align="center">One TypeScript route → typed SDK, docs, OpenAPI, and MCP.</h3>
  <p align="center">
    <strong>For humans:</strong>
    <a href="https://callspec.logfox.ai">callspec.logfox.ai</a>
    ·
    <a href="https://callspec.logfox.ai/demo/">Try the demo</a>
  </p>
  <p align="center">
    <a href="assets/callspec-flow.svg?cb=9">
      <img src="assets/callspec-flow.svg?cb=9" alt="Callspec flow: define in TypeScript, mountSpec, CLI SDK, and OpenAPI export" />
    </a>
  </p>
</div>

Most teams duct-tape the same API across REST routes, OpenAPI specs, DIY clients, docs, types, validators and MCP. That's a ton of repetitive work and brittle code that drifts.

Instead, define each route once in TypeScript — inputs, outputs, and errors — and Callspec ships the server, SDK, docs, OpenAPI, and MCP from that contract. One source of truth, unit-testable, no drift.

On the frontend you call `api.searchPosts({…})` and get a **Result** back — success value or a typed error `code` you can switch on. Same methods, same types, same errors as the server and as agents on MCP. Unit-test the real handler with `.handler(input, ctx)` — no HTTP, no `req`/`res`.

**For humans:** [callspec.logfox.ai](https://callspec.logfox.ai) · [Try the demo](https://callspec.logfox.ai/demo/)

## Skill

Read **[skills/callspec/SKILL.md](skills/callspec/SKILL.md)** first. Copy-paste prompts: [Working with Coding Agents](src/content/docs/coding-agents.md). Ignore `docs/internal/`.

## Contents

- [Single-file server example](src/content/docs/single-file-server-example.md)
- [Getting started](src/content/docs/getting-started.md)
- [Server layout](src/content/docs/server-layout.md)
- [Unit testing](src/content/docs/unit-testing.md)
- [Try the demo locally](src/content/docs/try-the-demo-locally.md)
- [Working with Coding Agents](src/content/docs/coding-agents.md)
- [Authentication](src/content/docs/authentication.md)
- [Request context](src/content/docs/request-context.md)
- [API reference — route](src/content/docs/api-reference/route.md)
- [API reference — spec](src/content/docs/api-reference/spec.md)
- [Error handling](src/content/docs/error-handling.md)
- [Outside Callspec](src/content/docs/outside-callspec.md)
- [Builtin errors](src/content/docs/builtin-errors.md)
- [SDK generation](src/content/docs/sdk-generation.md)
- [Client usage](src/content/docs/client-usage.md)
- [Shared validation](src/content/docs/shared-validation.md)
- [Docs UI](src/content/docs/docs-ui.md)
- [Docs UI branding](src/content/docs/docs-ui-branding.md)
- [Hosting Docs UI (CloudFront / Pages)](src/content/docs/hosting-cloudfront-pages.md)
- [MCP Server](src/content/docs/mcp.md)
- [OpenAPI](src/content/docs/openapi.md)
- [Multi-language SDKs](src/content/docs/multi-language-sdks.md)
- [Development](src/content/docs/development.md)
