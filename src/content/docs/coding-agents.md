# Working with Coding Agents

Copy-paste prompts for Cursor, Claude Code, Copilot, and similar tools &mdash; so agents adopt Callspec conventions instead of inventing REST/OpenAPI patterns.

## Docs prose

In `src/content/docs/`, write em dashes as `&mdash;` in prose (not the Unicode `—` character). Starlight and GitHub decode it on render; it keeps agents from copying literal em dashes into new edits. Leave dashes inside fenced code blocks and string literals as-is.

## Callspec skill

[`skills/callspec/SKILL.md`](../../skills/callspec/SKILL.md) (also in the npm package under `skills/`)

**Cursor:** save as `.cursor/skills/callspec/SKILL.md` (or symlink that path to `node_modules/callspec/skills/callspec/SKILL.md` / this repo).

## Prompt: work with Callspec

Install or attach the skill first, then:

```text
We're using Callspec (https://github.com/logfoxai/callspec) for typed TypeScript RPC.

Follow the Callspec skill.

Task: <what you want changed — e.g. add a route, fix error handling, regenerate the SDK>

Read guides under src/content/docs/ in this repo (index: README.md Contents) — start with getting-started.md, server-layout.md, error-handling.md, sdk-generation.md. Prefer the checkout; if fetching from GitHub over HTTP, use raw.githubusercontent.com/logfoxai/callspec/main/ + path.
```

## Prompt: migrate to Callspec

Install or attach the skill first, then:

```text
Migrate this API to Callspec (https://github.com/logfoxai/callspec). Follow the Callspec skill.

Goals:
- One TypeScript registry: route() → spec() → mountSpec() for HTTP RPC, docs UI, OpenAPI, and optional MCP
- runtyp preds for input/output; domain errors via defineErrors + return err.CODE()
- Frontend uses generated ApiClient from callspec.json (npx callspec …), not a hand-rolled client and not OpenAPI as the SDK source

Do this in order:
1. Install callspec, runtyp, and express.
2. Follow server-layout.md: one route() per file with inline handler; shared preds in schemas/; spec.ts = spec() registry only.
3. Convert each endpoint per route.md (see src/content/docs/api-reference/route.md in this repo).
4. Register routes with spec({ meta, routes, authenticate?, exports? }) and mount with mountSpec(app, api, { basePath }).
5. Generate the TypeScript client (live mount or optional pinned callspec.json); switch call sites to Result (result.ok / result.code).
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

Callspec can expose the **same** routes as MCP tools (`mcp: true` on `route()` → `{mount}/mcp`). That is for agents that **call** your live API &mdash; different from coding agents that edit your source.

See [MCP](./mcp.md).
