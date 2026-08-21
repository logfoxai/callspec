# Try the demo locally

Chirp is Callspec's sample API — a fictional social app (**Chirp API v2**). Use it to click around the explorer, fire live RPCs, and connect MCP.

## Hosted (browse-only)

[callspec.logfox.ai/demo](https://callspec.logfox.ai/demo/) is a static snapshot. You can browse routes and copy MCP snippets. **Send** and live MCP are off.

## Live API on your machine

```bash
git clone https://github.com/logfoxai/callspec.git
cd callspec && npm install
npm run build && npm run serve:chirp-demo
```

Open [http://127.0.0.1:3456/v1/docs](http://127.0.0.1:3456/v1/docs). Bearer token **`demo`** for authenticated routes and MCP.

That process is Callspec's built-in explorer on a real Chirp server — try-it, `callspec.json`, OpenAPI, and `/mcp`.

Already have the repo? After `npm run build`, just `npm run serve:chirp-demo`.

Working on the docs site or explorer UI itself? See [Development](./development.md).
