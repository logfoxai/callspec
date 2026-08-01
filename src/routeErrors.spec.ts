import {test} from 'kizu';
import {predicates as p} from 'runtyp';
import {CallspecRouteError, formatRouteErrorBody, isCallspecRouteError} from './errors';
import {documentRouteErrors} from './routeErrorDocument';
import {errors, resolveRouteErrorDefs} from './routeErrors';

test('errors: throws typed route errors', (assert) => {

    const err = errors({
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

test('errors: validates error data preds', (assert) => {

    const err = errors({
        INVALID: {status: 400, data: p.object({field: p.string()})},
    });

    const throwInvalid = err.INVALID as (data: unknown) => CallspecRouteError;

    assert.throws(
        () => throwInvalid({field: 123}),
        /data invalid/,
    );

});

test('errors: resolveRouteErrorDefs reads handle defs', (assert) => {

    const err = errors({
        NOT_FOUND: {status: 404},
    });

    assert.equal(resolveRouteErrorDefs(err)?.NOT_FOUND?.status, 404);

});

test('errors: any error code name works, including spec', (assert) => {

    const err = errors({
        spec: {status: 418},
        NOT_FOUND: {status: 404},
    });

    const thrown = err.spec();

    assert.equal(thrown.code, 'spec');
    assert.equal(thrown.status, 418);
    assert.equal(resolveRouteErrorDefs(err)?.NOT_FOUND?.status, 404);

});

test('documentRouteErrors: documents payload schemas', (assert) => {

    const documented = documentRouteErrors({
        NOT_FOUND: {status: 404},
        USER_EXISTS: {status: 409, data: p.object({email: p.string()})},
    });

    assert.equal(documented?.NOT_FOUND?.status, 404);
    assert.equal(documented?.NOT_FOUND?.data, undefined);
    assert.equal(
        (documented?.USER_EXISTS?.data as {properties?: {email?: unknown}})?.properties?.email !== undefined,
        true,
    );

});
