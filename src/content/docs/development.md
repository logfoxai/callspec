# Development

This page is for **working in this repo** (library, guide site, explorer UI). To run the live Chirp API as a user of Callspec, see [Try the demo locally](./try-the-demo-locally.md).

**Node:** library consumers need **18+**. This repo &mdash; especially `npm run validate`, `astro:dev`, and `astro:build` &mdash; needs **≥22.12** (Astro 7). CI builds the guide site on Node 24.

```bash
npm install
npm run validate       # build, lint, knip, typecheck:routes, test + coverage, astro:build
npm run astro:dev      # guide site + search + HMR — http://127.0.0.1:4321 (or next free port up to 4330)
npm run astro:build    # static site → docs-site/ (+ hosted Chirp explorer at /demo/)
npm run astro:build:pagefind  # rebuild docs-site + search index while astro:dev keeps running
```

`astro:dev` wipes compiler caches on start (after the port check). `astro:build` and `npm run validate` do **not** &mdash; they only refuse to run while dev is listening on **4321–4330**, so they never delete `.astro` out from under a live session. Use `npm run astro:build:pagefind` to rebuild search while dev keeps running. Live Chirp (try-it + MCP) is `npm run serve:chirp-demo` &mdash; documented on [Try the demo locally](./try-the-demo-locally.md).

## Guide site vs `/demo/`

| Command | What you get |
|---------|----------------|
| `npm run astro:dev` | Markdown guides, docs search (Pagefind index from the last build), and the Chirp explorer at `/demo/` (Vite HMR for explorer UI + search-modal CSS) |
| `npm run astro:build` | Guide site plus the **hosted** Chirp explorer at `/demo/` (browse-only; banner points at the local live API). Run once before first dev search. |
| `npm run astro:build:pagefind` | Rebuild `docs-site/` + Pagefind index while `astro:dev` keeps running (no port check). Use after editing doc pages when search results should update. |

The guide site is [Astro](https://astro.build/) with the [Starlight](https://starlight.astro.build/) docs theme. Source: `src/content/docs/`; config: `astro.config.mjs`; output: `docs-site/`. Production: [callspec.logfox.ai](https://callspec.logfox.ai) · explorer: [/demo/](https://callspec.logfox.ai/demo/).

## Writing guide pages

Guide sources in `src/content/docs/` are **plain markdown for GitHub** and the Astro guide site:

- Start with `# Page title` &mdash; no YAML frontmatter (GitHub renders frontmatter as an ugly widget).
- Link with relative paths: `[Authentication](./authentication.md)` &mdash; works on GitHub; Astro rewrites `.md` links to guide-site slugs at build time.
- At build time, the docs loader reads the `# heading` for Starlight metadata; PageTitle renders it in the chrome (the body `# heading` is hidden on the guide site).
- Splash-only CSS (`src/components/splash.css`) loads on the homepage only &mdash; not on guide pages.

Sidebar order: `astro.config.mjs`. Custom pages are Astro: `src/pages/index.astro` (splash) and `src/pages/404.astro` (`disable404Route` so Starlight does not inject its own). Guide MDX with component imports still works (`docs-ui.mdx`).

## Help build the standard

callspec is early &mdash; and we're looking for **maintainers and contributors** who want to help define how typed APIs work in the age of agents.

- **Issues & ideas:** [github.com/logfoxai/callspec/issues](https://github.com/logfoxai/callspec/issues)
- **PRs welcome** &mdash; `npm run validate` before you push; conventional commits (`feat:`, `fix:`, `docs:`, etc.)

## Support

Questions or stuck on an integration? Join us on [Discord](https://discord.gg/2wyYnBDhWQ) &mdash; reach out to **skyyskater** for direct help.
