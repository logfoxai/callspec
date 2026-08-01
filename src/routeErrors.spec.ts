import {test} from 'kizu';
import {predicates as p} from 'runtyp';
import {CallspecRouteError, formatRouteErrorBody, isCallspecRouteError} from './errors';
import {routeErrors} from './routeErrors';
import {routeErrorSchemas} from './routeErrorDocument';

test('routeErrors: throws typed route errors', (assert) => {

    const err = routeErrors({
        NOT_FOUND: {status: 404},
        USER_EXISTS: {status: 409, data: p.object({email: p.string()})},
    });

    const notFound = err.NOT_FOUND();

    assert.equal(notFound instanceof CallspecRouteError, true);
    assert.equal(notFound.code, 'NOT_FOUND');
    assert.equal(notFound.status, 404);
    assert.equal(notFound.data, undefined);
    assert.equal(isCallspecRouteError(notFound), true);

    const exists = err.USER_EXISTS({email: 'a@b.com'});

    assert.equal(exists.code, 'USER_EXISTS');
    assert.equal(exists.status, 409);
    assert.equal(exists.data, {email: 'a@b.com'});
    assert.equal(formatRouteErrorBody(exists).error, 'USER_EXISTS');
    assert.equal((formatRouteErrorBody(exists).data as {email: string}).email, 'a@b.com');

});

test('routeErrors: validates error data preds', (assert) => {

    const err = routeErrors({
        INVALID: {status: 400, data: p.object({field: p.string()})},
    });

    const throwInvalid = err.INVALID as (data: unknown) => CallspecRouteError;

    assert.throws(
        () => throwInvalid({field: 123}),
        /data invalid/,
    );

});

test('routeErrors: exposes defs for defineRoute', (assert) => {

    const err = routeErrors({
        NOT_FOUND: {status: 404},
    });

    assert.equal(err.$defs.NOT_FOUND?.status, 404);

});

test('routeErrorSchemas: documents wire format', (assert) => {

    const schemas = routeErrorSchemas({
        NOT_FOUND: {status: 404},
        USER_EXISTS: {status: 409, data: p.object({email: p.string()})},
    });

    assert.equal(schemas?.NOT_FOUND?.status, 404);
    assert.equal((schemas?.NOT_FOUND?.schema as {properties?: {error?: {const?: string}}}).properties?.error?.const, 'NOT_FOUND');
    assert.equal(
        (schemas?.USER_EXISTS?.schema as {required?: string[]}).required?.includes('data'),
        true,
    );

});
