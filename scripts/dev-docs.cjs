#!/usr/bin/env node
/**
 * Local dev server for callsheet UI — run after `npm run build`.
 * Usage: node scripts/dev-docs.cjs
 */
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const {mountRegistry} = require('../dist');
const {api} = require('./chirp-demo-api.cjs');

const app = express();
const router = express.Router();
const brandAssetsDir = path.join(__dirname, '../assets/chirp');

router.use(bodyParser.json());

mountRegistry(router, api, {
    docs: {
        openApi: {
            title: 'Chirp API v2',
            version: '2.0.0',
        },
        callsheet: {
            branding: {
                name: 'Chirp',
                intro: 'The Chirp API v2 lets you read and write posts, timelines, lists, and direct messages. This demo runs on callspec — one registry powers HTTP RPC, these docs, OpenAPI, and MCP tools.',
                websiteUrl: 'https://chirp.social',
                websiteLabel: 'chirp.social',
                logoUrl: './brand/mark.png',
                logoUrlDark: './brand/mark.png',
                logoSrcSet: './brand/mark.png 256w, ./brand/mark@2x.png 512w',
                logoSize: 80,
            },
            mcpPath: '../mcp',
            mcp: {
                authHint: 'Use Authorization: Bearer demo for private tools in this demo.',
            },
            brandAssetsDir,
        },
    },
    mcp: {
        serverInfo: {name: 'chirp-api', version: '2.0.0'},
        instructions: 'Chirp API v2 — Twitter-shaped demo. Use Bearer demo for authenticated tools.',
    },
    contextResolver: (req) => {

        if (req.headers.authorization === 'Bearer demo') {

            return {userId: '2244994945', username: 'api_demo'};

        }

        return undefined;

    },
});

app.use('/v1', router);

const port = Number(process.env.PORT ?? 3456);

app.listen(port, '127.0.0.1', () => {

    console.log(`callsheet demo: http://127.0.0.1:${port}/v1/docs`);
    console.log(`openapi:        http://127.0.0.1:${port}/v1/openapi.json`);
    console.log(`mcp:            http://127.0.0.1:${port}/v1/mcp`);
    console.log('auth:           Bearer demo (for private routes + MCP)');

});
