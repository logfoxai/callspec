# Development

## Install (contributors)

```bash
npm ci    # always — uses package-lock.json exactly; do not npm install after clone
```

If install fails with a missing `esbuild/install.js` or similar, the local `node_modules` is corrupted (interrupted install or bad npm cache). Recover with:

```bash
rm -rf node_modules
npm ci
```

**npm package consumers** (`npm install callspec` in another project) never install `devDependencies` — no esbuild, Vite, or VitePress. This install path is **clone/CI/contributors only**. CI runs `npm ci` on every PR (Node 20, 22, 24).

## Commands

```bash
npm run validate    # build, lint, knip, typecheck:routes, test + coverage
npm run docs:dev    # this guide site (VitePress) — http://127.0.0.1:5173
npm run docs:build  # static site → docs/.vitepress/dist
npm run dev:docs    # Chirp API demo — see README § Try the demo
```

## Guide site vs API demo

| Command | What you get |
|---------|----------------|
| `npm run docs:dev` | **Markdown guides** (getting started, error handling, …) with sidebar and search |
| `npm run dev:docs` | **Live Chirp API** with Callspec's built-in `/docs` explorer and MCP |

## Help build the standard

callspec is early — and we're looking for **maintainers and contributors** who want to help define how typed APIs work in the age of agents.

- **Issues & ideas:** [github.com/logfoxai/callspec/issues](https://github.com/logfoxai/callspec/issues)
- **PRs welcome** — `npm run validate` before you push; conventional commits (`feat:`, `fix:`, `docs:`, etc.)

## Support

Questions or stuck on an integration? Join us on [Discord](https://discord.gg/2wyYnBDhWQ) — reach out to **skyyskater** for direct help.
