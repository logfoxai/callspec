#!/usr/bin/env node
/**
 * Local dev server for callspec UI — run after `npm run build`.
 * Usage: node scripts/dev-docs.cjs
 */
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const {mountSpec} = require('../dist');
const {api} = require('../dist/demo/chirpDemoApi');

const app = express();
const router = express.Router();
const brandAssetsDir = path.join(__dirname, '../assets/chirp');

router.use(bodyParser.json());

mountSpec(router, api);

router.use('/docs/brand', express.static(brandAssetsDir, {index: false}));

app.use('/v1', router);

const port = Number(process.env.PORT ?? 3456);

app.listen(port, '127.0.0.1', () => {

    console.log(`callspec UI demo: http://127.0.0.1:${port}/v1/docs`);
    console.log(`openapi:        http://127.0.0.1:${port}/v1/openapi.json`);
    console.log(`mcp:            http://127.0.0.1:${port}/v1/mcp`);
    console.log('auth:           Bearer demo (for private routes + MCP)');

});
