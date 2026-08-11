import {test} from 'kizu';
import {BUILTIN_ERROR} from '../../builtinErrors';
import {CLIENT_ERROR} from '../../clientErrorNormalization/types';
import {partitionRouteErrors} from './routeErrorsCatalog';

test('partitionRouteErrors: always includes framework and client builtins', (assert) => {

    const {builtin, domain} = partitionRouteErrors({
        name: 'search',
        auth: 'none',
        errors: undefined,
    });

    const codes = builtin.map((entry) => entry.code);

    assert.equal(codes.includes(BUILTIN_ERROR.VALIDATION_ERROR), true);
    assert.equal(codes.includes(BUILTIN_ERROR.ROUTE_NOT_FOUND), true);
    assert.equal(codes.includes(BUILTIN_ERROR.INTERNAL_ERROR), true);
    assert.equal(codes.includes(BUILTIN_ERROR.NOT_FOUND), true);
    assert.equal(codes.includes(CLIENT_ERROR.NETWORK_ERROR), true);
    assert.equal(codes.includes(CLIENT_ERROR.UNKNOWN_ERROR), true);
    assert.equal(codes.includes(BUILTIN_ERROR.UNAUTHORIZED), false);
    assert.equal(domain.length, 0);

});

test('partitionRouteErrors: bearer routes include UNAUTHORIZED', (assert) => {

    const {builtin} = partitionRouteErrors({
        name: 'secret',
        auth: 'bearer',
        errors: undefined,
    });

    assert.equal(builtin.some((entry) => entry.code === BUILTIN_ERROR.UNAUTHORIZED), true);

});

test('partitionRouteErrors: domain errors stay separate from builtins', (assert) => {

    const {builtin, domain} = partitionRouteErrors({
        name: 'register',
        auth: 'none',
        errors: {
            USER_EXISTS: {
                status: 409,
                data: {type: 'object', properties: {email: {type: 'string'}}},
            },
        },
    });

    assert.equal(domain.length, 1);
    assert.equal(domain[0]?.code, 'USER_EXISTS');
    assert.equal(builtin.some((entry) => entry.code === 'USER_EXISTS'), false);

});

test('partitionRouteErrors: merged route.errors excludes builtins from domain', (assert) => {

    const {builtin, domain} = partitionRouteErrors({
        name: 'getUserById',
        auth: 'bearer',
        errors: {
            NOT_FOUND: {status: 404},
            FORBIDDEN: {status: 403},
            TOO_MANY_REQUESTS: {status: 429},
            SERVICE_UNAVAILABLE: {status: 503},
            USER_NOT_FOUND: {status: 404},
        },
    });

    assert.equal(domain.length, 1);
    assert.equal(domain[0]?.code, 'USER_NOT_FOUND');
    assert.equal(domain.some((entry) => entry.code === BUILTIN_ERROR.TOO_MANY_REQUESTS), false);
    assert.equal(builtin.some((entry) => entry.code === BUILTIN_ERROR.TOO_MANY_REQUESTS), true);

});
