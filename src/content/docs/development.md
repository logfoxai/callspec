---
title: Development
---

# Development

```bash
npm install
npm run validate    # build, lint, knip, typecheck:routes, test + coverage
npm run docs:dev    # guide site (Starlight) — http://127.0.0.1:4321 (Node ≥22.12)
npm run docs:build  # static site → docs-site/ (Node ≥22.12)
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
