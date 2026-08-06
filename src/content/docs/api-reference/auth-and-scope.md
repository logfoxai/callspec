---
title: Auth and scope
---

# Auth and scope

See [Authentication](../authentication.md) and [Request context](../request-context.md) for full examples.

- **`auth: 'none'`** — no credentials required
- **`auth: 'bearer'`** (default) — 401 without valid Bearer token
- **`authenticate(token, req)`** on the spec — your hook; callspec extracts Bearer and calls it with the Express `req`

**Scope** controls export surfaces (not HTTP mounting — all routes stay callable on the server):

- **`scope: 'public'`** (default) — included in `callspec.json`, OpenAPI, docs UI, SDK codegen, and MCP `tools/list`
- **`scope: 'private'`** — server-only; omitted from those exports

OpenAPI Bearer security is **auto-derived** from route `auth`.

← [API reference](../api-reference.md)
