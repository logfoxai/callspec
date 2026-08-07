---
title: Development
---

**Node:** library consumers need **18+**. Working in this repo — especially `npm run validate`, `astro:dev`, and `astro:build` — needs **≥22.12** (Astro 7). CI runs the guide site build on Node 24.

```bash
npm install
npm run validate       # build, lint, knip, typecheck:routes, test + coverage, astro:build
npm run astro:dev      # guide site — http://127.0.0.1:4321
npm run astro:build    # static site → docs-site/
npm run astro:preview  # serve production guide site locally
npm run serve:chirp-demo   # Chirp demo — http://127.0.0.1:3456/v1/docs (token: demo)
```

## Documentation source

| Surface | What you see |
|---------|----------------|
| **This folder** (`src/content/docs/`) | Source of truth — edit markdown/MDX here |
| **GitHub** | Same files, rendered when you browse the repo or follow README links |
| **Guide site** (`npm run astro:dev`) | Same content with Starlight sidebar, search, and splash homepage |

Sidebar order lives in `astro.config.mjs` only — the README no longer duplicates a table of contents.

The guide site is [Astro](https://astro.build/) + [Starlight](https://starlight.astro.build/). Config: `astro.config.mjs`; build output: `docs-site/`.

## Guide site vs Chirp demo

| Command | What you get |
|---------|----------------|
| `npm run astro:dev` | **Markdown guides** (getting started, error handling, …) — sidebar and search |
| `npm run serve:chirp-demo` | **Live Chirp demo API** with Callspec's built-in `/v1/docs` explorer, OpenAPI, and MCP |

## Help build the standard

callspec is early — and we're looking for **maintainers and contributors** who want to help define how typed APIs work in the age of agents.

- **Issues & ideas:** [github.com/logfoxai/callspec/issues](https://github.com/logfoxai/callspec/issues)
- **PRs welcome** — `npm run validate` before you push; conventional commits (`feat:`, `fix:`, `docs:`, etc.)

## Support

Questions or stuck on an integration? Join us on [Discord](https://discord.gg/2wyYnBDhWQ) — reach out to **skyyskater** for direct help.
