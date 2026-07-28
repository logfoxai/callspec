#!/usr/bin/env node
/**
 * Local dev server for callsheet UI — run after `npm run build`.
 * Usage: node scripts/dev-docs.cjs
 */
const express = require('express');
const bodyParser = require('body-parser');
const {mountRegistry} = require('../dist');
const {api} = require('./chirp-demo-api.cjs');

const app = express();
const router = express.Router();

router.use(bodyParser.json());

mountRegistry(router, api, {
    docs: {
        openApi: {
            title: 'Chirp API v2',
            version: '2.0.0',
            description: 'Fictional social API demo — Twitter/X-shaped routes for callsheet development.',
        },
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
    console.log('auth:           Bearer demo (for private routes)');

});
