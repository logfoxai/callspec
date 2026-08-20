# Development

**Node:** library consumers need **18+**. Working in this repo — especially `npm run validate`, `astro:dev`, and `astro:build` — needs **≥22.12** (Astro 7). CI runs the guide site build on Node 24.

```bash
npm install
npm run validate       # build, lint, knip, typecheck:routes, test + coverage, astro:build
npm run astro:dev      # guide site — http://127.0.0.1:4321 (refuses if that port is taken; then wipes caches)
npm run astro:build    # static site → docs-site/ (+ hosted Chirp explorer at /demo/)
npm run astro:preview  # serve production guide site locally
npm run serve:chirp-demo   # live Chirp API — http://127.0.0.1:3456/v1/docs (token: demo)
```

## Writing guide pages

Guide sources in `src/content/docs/` are **plain markdown for GitHub** and the Astro guide site:

- Start with `# Page title` — no YAML frontmatter (GitHub renders frontmatter as an ugly widget).
- Link with relative paths: `[Authentication](./authentication.md)` — works on GitHub; Astro rewrites `.md` links to guide-site slugs at build time.
- At build time, the docs loader reads the `# heading` for Starlight metadata; PageTitle renders it in the chrome (the body `# heading` is hidden on the guide site).
- Splash-only CSS (`src/components/splash.css`) loads on the homepage only — not on guide pages.

Sidebar order: `astro.config.mjs`. Splash homepage `index.mdx` and `404.mdx` are frontmatter only — bodies are Astro overrides (`Hero.astro`, `MarkdownContent.astro`). Guide MDX with component imports still works (`docs-ui.mdx`).

After `npm install`, Astro content IntelliSense needs the official **Astro** extension and a window reload. Workspace settings turn on `astro.content-intellisense`.

## Guide site vs Chirp demo

| Command | What you get |
|---------|----------------|
| `npm run astro:dev` | **Markdown guides** (getting started, error handling, …) — sidebar and search |
| `npm run astro:build` | Guide site plus **hosted Chirp explorer** at `/demo/` (browse routes; banner points to local for live RPC/MCP) |
| `npm run serve:chirp-demo` | **Live Chirp demo API** with Callspec's built-in `/v1/docs` explorer, OpenAPI, and MCP |

The guide site is [Astro](https://astro.build/) with the [Starlight](https://starlight.astro.build/) docs theme — sidebar, search, and MDX out of the box. Source: `src/content/docs/`; config: `astro.config.mjs`; output: `docs-site/`. Production: [callspec.logfox.ai](https://callspec.logfox.ai) · explorer: [/demo/](https://callspec.logfox.ai/demo/).

## Help build the standard

callspec is early — and we're looking for **maintainers and contributors** who want to help define how typed APIs work in the age of agents.

- **Issues & ideas:** [github.com/logfoxai/callspec/issues](https://github.com/logfoxai/callspec/issues)
- **PRs welcome** — `npm run validate` before you push; conventional commits (`feat:`, `fix:`, `docs:`, etc.)

## Support

Questions or stuck on an integration? Join us on [Discord](https://discord.gg/2wyYnBDhWQ) — reach out to **skyyskater** for direct help.

