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

## Quick start

```bash
npm i callspec runtyp express
```

[Getting started](src/content/docs/getting-started.md) walks through a route, `spec()`, `mountSpec()`, and the generated client. For a minimal one-file spike, see [Single-file server example](src/content/docs/single-file-server-example.md).

## Coding agents

Optional — for Cursor, Claude Code, and similar tools: [`skills/callspec/SKILL.md`](skills/callspec/SKILL.md) (rules) and [copy-paste prompts](src/content/docs/coding-agents.md). The guides below are the source of truth for the API.

## Contents

Same guides as [callspec.logfox.ai](https://callspec.logfox.ai). Links are repo-relative — they work in a checkout and on GitHub’s file browser.

### Introduction

- [Single-file server example](src/content/docs/single-file-server-example.md)
- [Getting started](src/content/docs/getting-started.md)
- [Server layout](src/content/docs/server-layout.md)
- [Unit testing](src/content/docs/unit-testing.md)
- [Try the demo locally](src/content/docs/try-the-demo-locally.md)

### API reference

- [`route`](src/content/docs/api-reference/route.md)
- [`spec`](src/content/docs/api-reference/spec.md)
- [`mountSpec`](src/content/docs/api-reference/mount-spec.md)
- [Auth and scope](src/content/docs/api-reference/auth-and-scope.md)
- [Surfaces & exports](src/content/docs/api-reference/surfaces-and-exports.md)
- [Builtin errors](src/content/docs/builtin-errors.md)

### Working with Coding Agents

- [Skill & prompts](src/content/docs/coding-agents.md)

### Server

- [Authentication](src/content/docs/authentication.md)
- [Request context](src/content/docs/request-context.md)
- [Error handling](src/content/docs/error-handling.md)
- [File uploads](src/content/docs/file-uploads.md)
- [Outside Callspec](src/content/docs/outside-callspec.md)

### Client

- [SDK generation](src/content/docs/sdk-generation.md)
- [Client usage](src/content/docs/client-usage.md)
- [Shared validation](src/content/docs/shared-validation.md)

### Docs UI

- [Overview](src/content/docs/docs-ui.md)
- [Branding](src/content/docs/docs-ui-branding.md)
- [Hosting (CloudFront / Pages)](src/content/docs/hosting-cloudfront-pages.md)

### MCP Server

- [Overview](src/content/docs/mcp.md)

### OpenAPI

- [Overview](src/content/docs/openapi.md)
- [Multi-language SDKs](src/content/docs/multi-language-sdks.md)

### Project

- [Development](src/content/docs/development.md)
