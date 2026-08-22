# Working with Coding Agents

Copy-paste prompts for Cursor, Claude Code, Copilot, and similar tools — so agents adopt Callspec conventions instead of inventing REST/OpenAPI patterns.

Human walkthrough: [Getting started](./getting-started.md). Topic guides: [README Contents](https://github.com/logfoxai/callspec#contents). Ignore `docs/internal/`.

## Callspec skill

The rules live in **[`skills/callspec/SKILL.md`](https://github.com/logfoxai/callspec/blob/main/skills/callspec/SKILL.md)** (also shipped on npm under `skills/`). Point agents at that file — do not keep a second copy here.

**Cursor:** save as `.cursor/skills/callspec/SKILL.md` (or symlink that path to `node_modules/callspec/skills/callspec/SKILL.md` / this repo). Other tools: attach the file, or paste it once into chat if the agent cannot read the repo.

What it encodes, in short:

- Return `err.*` for expected failures; a bare `throw` becomes `INTERNAL_ERROR`
- Generate SDKs from `callspec.json` (`npx callspec …`), not OpenAPI
- Default `auth` is `bearer`; `scope: 'private'` still requires auth
- On `!result.ok`, branch on `result.code`
- Don’t put Express error middleware on the `mountSpec` router
- When splitting files, follow [Server layout](./server-layout.md) — one `route()` per file with an inline handler
- Uploads: `file()` on an input field makes the route multipart; MCP is JSON-only

## Prompt: work with Callspec

Install or attach the skill first, then:

```text
We're using Callspec (https://github.com/logfoxai/callspec) for typed TypeScript RPC.

Follow the Callspec skill (return err.* for expected failures; codegen from callspec.json not OpenAPI; branch on result.code; don't put Express error middleware on the mountSpec router).

Task: <what you want changed — e.g. add a route, fix error handling, regenerate the SDK>

Read guides under https://github.com/logfoxai/callspec/tree/main/src/content/docs — start with getting-started.md, server-layout.md, error-handling.md, and sdk-generation.md as needed. Ignore docs/internal/.
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
3. Convert each endpoint to route({ input, output, errors?, auth, mcp?, meta, handler }) — handlers return values or err.*; do not throw for expected failures.
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

Callspec can expose the **same** routes as MCP tools (`mcp: true` on `route()` → `{mount}/mcp`). That is for agents that **call** your live API — different from coding agents that edit your source.

See [MCP](./mcp.md).
