import {test} from 'kizu';
import {predicates as p} from 'runtyp';
import {formatRouteFailureBody, isRouteFailure} from './errors';
import {BUILTIN_ERROR} from './builtinErrors';
import {documentRouteErrors} from './routeErrorDocument';
import {defineErrors, resolveRouteErrorDefs} from './defineErrors';

test('defineErrors: domain status defaults to 400', (assert) => {

    const routeErr = defineErrors({
        FOO: {},
    });

    assert.equal(routeErr.FOO().status, 400);

});

test('defineErrors: domain status can be overridden', (assert) => {

    const routeErr = defineErrors({
        spec: {status: 418},
    });

    assert.equal(routeErr.spec().status, 418);

});

test('defineErrors: includes builtin failers without declaring them', (assert) => {

    const routeErr = defineErrors({
        USER_EXISTS: {data: p.object({email: p.string()})},
    });

    const notFound = routeErr.NOT_FOUND();

    assert.equal(notFound.ok, false);
    assert.equal(notFound.code, BUILTIN_ERROR.NOT_FOUND);
    assert.equal(notFound.status, 404);
    assert.equal(isRouteFailure(notFound), true);

    const exists = routeErr.USER_EXISTS({email: 'a@b.com'});

    assert.equal(exists.code, 'USER_EXISTS');
    assert.equal(exists.status, 400);
    assert.equal(exists.data, {email: 'a@b.com'});
    assert.equal(formatRouteFailureBody(exists).error, 'USER_EXISTS');
    assert.equal((formatRouteFailureBody(exists).data as {email: string}).email, 'a@b.com');

});

test('defineErrors: builtin failers accept optional declared context pred', (assert) => {

    const routeErr = defineErrors({});

    const plain = routeErr.NOT_FOUND();

    assert.equal(plain.code, BUILTIN_ERROR.NOT_FOUND);
    assert.equal(plain.data, undefined);

    const withData = routeErr.NOT_FOUND({message: 'User missing'});

    assert.equal(withData.code, BUILTIN_ERROR.NOT_FOUND);
    assert.equal(withData.data, {message: 'User missing'});
    assert.equal(formatRouteFailureBody(withData).data, {message: 'User missing'});

    assert.throws(
        () => routeErr.NOT_FOUND({message: 123}),
        /data invalid/,
    );

});

test('defineErrors: rejects redeclaring builtin codes', (assert) => {

    assert.throws(
        () => defineErrors({
            [BUILTIN_ERROR.NOT_FOUND]: {status: 404},
        }),
        /Cannot declare builtin error/,
    );

});

test('defineErrors: validates error data preds', (assert) => {

    const routeErr = defineErrors({
        INVALID: {data: p.object({field: p.string()})},
    });

    const failInvalid = routeErr.INVALID as (data: unknown) => import('./types').RouteFailure;

    assert.throws(
        () => failInvalid({field: 123}),
        /data invalid/,
    );

});

test('defineErrors: resolveRouteErrorDefs returns domain defs only', (assert) => {

    const routeErr = defineErrors({
        USER_EXISTS: {status: 409},
    });

    assert.equal(resolveRouteErrorDefs(routeErr)?.USER_EXISTS?.status, 409);
    assert.equal(resolveRouteErrorDefs(routeErr)?.NOT_FOUND, undefined);

});

test('defineErrors: any domain code name works', (assert) => {

    const routeErr = defineErrors({
        spec: {status: 418},
    });

    const failure = routeErr.spec();

    assert.equal(failure.code, 'spec');
    assert.equal(failure.status, 418);
    assert.equal(failure.ok, false);

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
