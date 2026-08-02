import {test} from 'kizu';
import {predicates as p} from 'runtyp';
import {RouteError, formatRouteErrorBody, isRouteError} from './errors';
import {documentRouteErrors} from './routeErrorDocument';
import {COMMON_ERROR} from './commonErrors';
import {errors, resolveRouteErrorDefs} from './routeErrors';

test('errors: includes common throwers without declaring them', (assert) => {

    const err = errors({
        USER_EXISTS: {status: 409, data: p.object({email: p.string()})},
    });

    const notFound = err.NOT_FOUND();

    assert.equal(notFound instanceof RouteError, true);
    assert.equal(notFound.code, COMMON_ERROR.NOT_FOUND);
    assert.equal(notFound.status, 404);
    assert.equal(isRouteError(notFound), true);

    const exists = err.USER_EXISTS({email: 'a@b.com'});

    assert.equal(exists.code, 'USER_EXISTS');
    assert.equal(exists.status, 409);
    assert.equal(exists.data, {email: 'a@b.com'});
    assert.equal(formatRouteErrorBody(exists).error, 'USER_EXISTS');
    assert.equal((formatRouteErrorBody(exists).data as {email: string}).email, 'a@b.com');

});

test('errors: rejects redeclaring common codes', (assert) => {

    assert.throws(
        () => errors({
            [COMMON_ERROR.NOT_FOUND]: {status: 404},
        }),
        /Cannot declare common error/,
    );

});

test('errors: validates error data preds', (assert) => {

    const err = errors({
        INVALID: {status: 400, data: p.object({field: p.string()})},
    });

    const throwInvalid = err.INVALID as (data: unknown) => RouteError;

    assert.throws(
        () => throwInvalid({field: 123}),
        /data invalid/,
    );

});

test('errors: resolveRouteErrorDefs returns domain defs only', (assert) => {

    const err = errors({
        USER_EXISTS: {status: 409},
    });

    assert.equal(resolveRouteErrorDefs(err)?.USER_EXISTS?.status, 409);
    assert.equal(resolveRouteErrorDefs(err)?.NOT_FOUND, undefined);

});

test('errors: any domain code name works', (assert) => {

    const err = errors({
        spec: {status: 418},
    });

    const thrown = err.spec();

    assert.equal(thrown.code, 'spec');
    assert.equal(thrown.status, 418);

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
