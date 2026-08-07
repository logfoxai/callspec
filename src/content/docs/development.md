---
title: Development
---

**Node:** library consumers need **18+**. Working in this repo — especially `npm run validate`, `dev:astro`, and `build:astro` — needs **≥22.12** (Astro 7). CI runs the Astro build on Node 24.

```bash
npm install
npm run validate       # build, lint, knip, typecheck:routes, test + coverage, build:astro
npm run dev:astro      # Astro guide site — http://127.0.0.1:4321
npm run build:astro    # static site → docs-site/
npm run preview:astro  # serve production Astro build locally
npm run serve:chirp-demo   # Chirp demo API + mountSpec docs UI — see README § Try the demo
```

## Astro guide site vs Chirp demo

| Command | What you get |
|---------|----------------|
| `npm run dev:astro` | **Markdown guides** (getting started, error handling, …) — sidebar and search |
| `npm run serve:chirp-demo` | **Live Chirp demo API** with Callspec's built-in `/v1/docs` explorer, OpenAPI, and MCP |

The guide site is Astro with the [Starlight](https://starlight.astro.build/) docs theme. Starlight is not a separate stack — it's an Astro integration that gives you sidebar, search, and MDX out of the box.

## Help build the standard

callspec is early — and we're looking for **maintainers and contributors** who want to help define how typed APIs work in the age of agents.

- **Issues & ideas:** [github.com/logfoxai/callspec/issues](https://github.com/logfoxai/callspec/issues)
- **PRs welcome** — `npm run validate` before you push; conventional commits (`feat:`, `fix:`, `docs:`, etc.)

## Support

Questions or stuck on an integration? Join us on [Discord](https://discord.gg/2wyYnBDhWQ) — reach out to **skyyskater** for direct help.
