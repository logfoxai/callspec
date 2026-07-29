import {test} from 'kizu';
import {predicates as p} from 'runtyp';
import {defineRoute, defineSpec} from '.';
import {emitOpenApi} from './openapi';

const api = defineSpec({
    routes: {
        healthcheck: defineRoute({
            input: p.object({}),
            meta: {summary: 'Health check', description: 'Public health check', tags: ['system']},
            access: 'public',
            handler: (_input, _ctx) => ({status: 'ok'}),
        }),
        getSecret: defineRoute({
            input: p.object({}),
            meta: {summary: 'Private route', description: 'Requires auth', tags: ['system']},
            access: 'private',
            handler: (_input, _ctx) => ({secret: true}),
        }),
    },
    meta: {
        authenticate: () => ({userId: 'test'}),
    },
});

type OpenApiOperation = {
    security?: Array<Record<string, string[]>>
    responses?: Record<string, {description?: string}>
};

type OpenApiPaths = Record<string, {post?: OpenApiOperation}>;

test('emitOpenApi: bearer security only on private routes', (assert) => {

    const doc = emitOpenApi(api.routes, {
        title: 'Test API',
        version: '1.0.0',
    });

    const paths = doc.paths as OpenApiPaths;
    const health = paths['/healthcheck']?.post;
    const secret = paths['/getSecret']?.post;

    assert.equal(JSON.stringify(health?.security), '[]', 'public route opts out of bearer');
    assert.equal(JSON.stringify(secret?.security), JSON.stringify([{bearer: []}]), 'private route requires bearer');
    assert.equal(health?.responses?.['401'], undefined, 'public route has no 401');
    assert.equal(secret?.responses?.['401']?.description, 'Unauthorized', 'private route documents 401');

    const components = doc.components as {securitySchemes?: {bearer?: unknown}};

    assert.equal(components.securitySchemes?.bearer !== undefined, true, 'bearer scheme present');

});
