import {test} from 'kizu';
import {predicates as p} from 'runtyp';
import {defineRoute} from './defineRoute';
import {emitOpenApi} from './openapi';
import {COMMON_ERROR} from './commonErrors';
import {FRAMEWORK_ERROR, mergeOpenApiErrorResponses, openApiFrameworkErrorResponses} from './frameworkErrors';
import {errors} from './routeErrors';
import {openApiErrorResponses} from './routeErrorDocument';

test('errors: common throwers are always on the handle', (assert) => {

    const err = errors({
        USER_EXISTS: {status: 409, data: p.object({email: p.string()})},
    });

    assert.equal(typeof err.NOT_FOUND, 'function');
    assert.equal(typeof err.FORBIDDEN, 'function');
    assert.equal(typeof err.CONFLICT, 'function');
    assert.equal(typeof err.TOO_MANY_REQUESTS, 'function');
    assert.equal(typeof err.SERVICE_UNAVAILABLE, 'function');
    assert.equal(err.NOT_FOUND().status, 404);
    assert.equal(err.FORBIDDEN().status, 403);
    assert.equal(err.TOO_MANY_REQUESTS({title: 'x', message: 'y'}).code, COMMON_ERROR.TOO_MANY_REQUESTS);

});

test('openApiErrorResponses: includes framework and common errors on every route', (assert) => {

    const responses = openApiErrorResponses(undefined, {includeUnauthorized: true});

    assert.equal((responses['400'] as {description?: string})?.description, FRAMEWORK_ERROR.VALIDATION_ERROR);
    assert.equal((responses['401'] as {description?: string})?.description, FRAMEWORK_ERROR.UNAUTHORIZED);
    assert.equal((responses['404'] as {description?: string})?.description?.includes(COMMON_ERROR.NOT_FOUND), true);
    assert.equal((responses['500'] as {description?: string})?.description, FRAMEWORK_ERROR.INTERNAL_ERROR);
    assert.equal((responses['429'] as {description?: string})?.description?.includes(COMMON_ERROR.TOO_MANY_REQUESTS), true);

});

test('mergeOpenApiErrorResponses: combines framework and domain 404 schemas', (assert) => {

    const framework = openApiFrameworkErrorResponses();
    const domain = openApiErrorResponses({CUSTOM: {status: 404}});
    const merged = mergeOpenApiErrorResponses(framework, domain);
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

    assert.equal(secret?.responses?.['401']?.description, FRAMEWORK_ERROR.UNAUTHORIZED);
    assert.equal(secret?.responses?.['500']?.description, FRAMEWORK_ERROR.INTERNAL_ERROR);
    assert.equal(secret?.responses?.['429']?.description?.includes(COMMON_ERROR.TOO_MANY_REQUESTS), true);

});
