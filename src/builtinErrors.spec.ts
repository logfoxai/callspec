import {test} from 'kizu';
import {predicates as p} from 'runtyp';
import {defineRoute} from './defineRoute';
import {emitOpenApi} from './openapi';
import {BUILTIN_ERROR, mergeOpenApiErrorResponses, openApiMountBuiltinErrorResponses} from './builtinErrors';
import {defineErrors} from './defineErrors';
import {openApiErrorResponses} from './routeErrorDocument';

test('defineErrors: builtin failers are always on the handle', (assert) => {

    const routeErr = defineErrors({
        USER_EXISTS: {data: p.object({email: p.string()})},
    });

    assert.equal(typeof routeErr.NOT_FOUND, 'function');
    assert.equal(typeof routeErr.FORBIDDEN, 'function');
    assert.equal(typeof routeErr.CONFLICT, 'function');
    assert.equal(typeof routeErr.TOO_MANY_REQUESTS, 'function');
    assert.equal(typeof routeErr.SERVICE_UNAVAILABLE, 'function');
    assert.equal(routeErr.NOT_FOUND().status, 404);
    assert.equal(routeErr.FORBIDDEN().status, 403);
    assert.equal(routeErr.TOO_MANY_REQUESTS({title: 'x', message: 'y'}).code, BUILTIN_ERROR.TOO_MANY_REQUESTS);
    assert.equal(routeErr.TOO_MANY_REQUESTS().code, BUILTIN_ERROR.TOO_MANY_REQUESTS);

});

test('openApiErrorResponses: includes all builtin errors on every route', (assert) => {

    const responses = openApiErrorResponses(undefined, {includeUnauthorized: true});

    assert.equal((responses['400'] as {description?: string})?.description, BUILTIN_ERROR.VALIDATION_ERROR);
    assert.equal((responses['401'] as {description?: string})?.description, BUILTIN_ERROR.UNAUTHORIZED);
    assert.equal((responses['404'] as {description?: string})?.description?.includes(BUILTIN_ERROR.NOT_FOUND), true);
    assert.equal((responses['404'] as {description?: string})?.description?.includes(BUILTIN_ERROR.ROUTE_NOT_FOUND), true);
    assert.equal((responses['500'] as {description?: string})?.description, BUILTIN_ERROR.INTERNAL_ERROR);
    assert.equal((responses['429'] as {description?: string})?.description?.includes(BUILTIN_ERROR.TOO_MANY_REQUESTS), true);

});

test('mergeOpenApiErrorResponses: combines mount and domain 404 schemas', (assert) => {

    const mountBuiltin = openApiMountBuiltinErrorResponses();
    const domain = openApiErrorResponses({CUSTOM: {status: 404}});
    const merged = mergeOpenApiErrorResponses(mountBuiltin, domain);
    const schema = (merged['404'] as {
        content?: {'application/json'?: {schema?: {oneOf?: unknown[]}}}
    })?.content?.['application/json']?.schema;

    assert.equal(Array.isArray(schema?.oneOf), true);
    assert.equal((schema?.oneOf?.length ?? 0) >= 2, true);

});

test('emitOpenApi: private routes document UNAUTHORIZED JSON schema', (assert) => {

    const doc = emitOpenApi({
        secret: defineRoute({
            input: p.object({}),
            output: p.string(),
            meta: {summary: 'Secret', description: 'Secret', tags: ['x']},
            access: 'private',
            handler: async (_input, _ctx) => 'ok',
        }),
    }, {title: 'API', version: '1.0.0'});

    const secret = (doc.paths as Record<string, {post?: {responses?: Record<string, {description?: string}>}}>)['/secret']?.post;

    assert.equal(secret?.responses?.['401']?.description, BUILTIN_ERROR.UNAUTHORIZED);
    assert.equal(secret?.responses?.['500']?.description, BUILTIN_ERROR.INTERNAL_ERROR);
    assert.equal(secret?.responses?.['429']?.description?.includes(BUILTIN_ERROR.TOO_MANY_REQUESTS), true);

});
