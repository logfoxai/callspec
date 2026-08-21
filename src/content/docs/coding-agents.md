# Working with Coding Agents

Copy-paste helpers for Cursor, Claude Code, Copilot, and similar tools — so agents adopt Callspec conventions instead of inventing REST/OpenAPI patterns.

Human walkthrough: [Getting started](./getting-started.md). Topic guides: [README Contents](https://github.com/logfoxai/callspec#contents). Ignore `docs/internal/`.

## Callspec skill

Canonical file: [`skills/callspec/SKILL.md`](https://github.com/logfoxai/callspec/blob/main/skills/callspec/SKILL.md) (also shipped in the npm package under `skills/`).

**Cursor:** save as `.cursor/skills/callspec/SKILL.md` (or symlink that path to the file in `node_modules/callspec` / this repo).

Copy the block below into a skill file or paste it into the agent chat:

````markdown title="SKILL.md"
---
name: callspec
description: >-
  Use when defining callspec routes, mountSpec, SDK codegen, Result-typed errors,
  MCP, or generated ApiClient code. Read before changing RPC APIs or error contracts.
disable-model-invocation: true
---

# Callspec

Start at the [README Contents](https://github.com/logfoxai/callspec#contents) — pick the guide under `src/content/docs/`. Ignore `docs/internal/`.

## Do not get wrong

1. Handlers **return** `err.*` / domain handles for expected failures. Bare `throw` → `INTERNAL_ERROR`.
2. SDK/codegen reads **`callspec.json`** (`npx callspec …`), **not** OpenAPI.
3. Default `auth` is **`bearer`** — requires `authenticate` on `spec()`, or set `auth: 'none'`.
4. `scope: 'private'` is still mounted; does **not** skip auth. Use `visibility: 'all'` on `mountSpec` to document those routes on that mount.
5. Never re-declare **builtin** codes on route `errors:`. Domain codes must be registered (`defineErrors`).
6. When `!result.ok`, branch on **`result.code`**, not HTTP status. Don’t show `UNKNOWN_ERROR.data` to users.
7. Don’t wire Express error middleware / jsout on the `mountSpec` router — it owns the catch path.
8. After route/error changes: regenerate the client; commit pinned contract if the repo pins one.
9. Prefer generated **`ApiClient`** over raw `CallspecClient`. Form preds live on generated **`schemas`** (from `exports` + route wire shapes).
10. Fern docs MCP ≠ Callspec `/mcp` tools — different jobs.
11. **Layout:** follow [Server layout](https://github.com/logfoxai/callspec/blob/main/src/content/docs/server-layout.md) when splitting — one `route()` per file with **inline** `handler`; shared preds in `schemas/`; `routes.ts` = `spec()` registry only.
````

## Prompt: work with Callspec

Paste the skill above first (or install it as a Cursor skill), then:

```text
We're using Callspec (https://github.com/logfoxai/callspec) for typed TypeScript RPC.

Follow the Callspec skill I provided (return err.* for expected failures; codegen from callspec.json not OpenAPI; branch on result.code; don't put Express error middleware on the mountSpec router).

Task: <what you want changed — e.g. add a route, fix error handling, regenerate the SDK>

Read guides under https://github.com/logfoxai/callspec/tree/main/src/content/docs — start with getting-started.md, server-layout.md, error-handling.md, and sdk-generation.md as needed. Ignore docs/internal/.
```

## Prompt: migrate to Callspec

Paste the skill above first, then:

```text
Migrate this API to Callspec (https://github.com/logfoxai/callspec). Follow the Callspec skill I provided.

Goals:
- One TypeScript registry: route() → spec() → mountSpec() for HTTP RPC, docs UI, OpenAPI, and optional MCP
- runtyp preds for input/output; domain errors via defineErrors + return err.CODE()
- Frontend uses generated ApiClient from callspec.json (npx callspec …), not a hand-rolled client and not OpenAPI as the SDK source

Do this in order:
1. Install callspec + runtyp (+ express peer). Sketch meta + authenticate if routes need bearer auth.
2. Follow server-layout.md: one route() per file with inline handler; shared preds in schemas/; routes.ts = spec() registry only.
3. Convert each endpoint to route({ input, output, errors?, auth, mcp?, meta, handler }) — handlers return values or err.*; do not throw for expected failures.
4. Register routes with spec({ meta, routes, authenticate?, exports? }) and mount with mountSpec(app, api, { basePath }).
5. Emit/pin callspec.json; generate the TypeScript client into the frontend; switch call sites to Result (result.ok / result.code).
6. Remove parallel REST routers, ad-hoc status mapping, and duplicate client types once parity is proven.

Constraints:
- Don't invent REST CRUD wrappers — Callspec is RPC methods (getProductById, …)
- scope: 'private' is documented when mountSpec visibility is 'all'; it does not skip auth
- Builtin error codes are reserved — only register domain codes
- Prefer small PRs: pilot one route end-to-end before bulk migration

Repo / stack notes: <paste stack — Express version, auth model, existing OpenAPI/tRPC/etc., monorepo layout>

Start by proposing the target folder layout (per server-layout.md) and the first pilot route, then implement.
```

## Runtime agents (MCP)

Callspec can expose the **same** routes as MCP tools (`mcp: true` on `route()` → `{mount}/mcp`). That is for agents that **call** your live API — different from coding agents that edit your source.

See [MCP](./mcp.md).
