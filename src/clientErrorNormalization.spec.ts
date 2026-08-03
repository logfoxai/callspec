import {test} from 'kizu';
import {BUILTIN_ERROR} from './builtinErrors';
import {CLIENT_ERROR, normalizeClientErrorBody, resolveRouteClientError} from './clientErrorNormalization';

test('resolveRouteClientError: 401 plain message maps via status before fuzzy', (assert) => {

    const result = resolveRouteClientError({
        status: 401,
        body: 'Bearer token required',
    });

    assert.equal(result.code, BUILTIN_ERROR.UNAUTHORIZED);

});

test('resolveRouteClientError: undeclared callspec error field yields UNKNOWN_ERROR', (assert) => {

    const body = {error: 'USER_EXISTS', data: {email: 'taken@example.com'}};
    const result = resolveRouteClientError({
        status: 409,
        body,
        allowedErrorCodes: ['NOT_FOUND'],
    });

    assert.equal(result.code, CLIENT_ERROR.UNKNOWN_ERROR);

    if (result.code === CLIENT_ERROR.UNKNOWN_ERROR) {

        assert.equal(result.data.body, body);

    }

});

test('resolveRouteClientError: declared domain error from callspec JSON', (assert) => {

    const result = resolveRouteClientError({
        status: 409,
        body: {error: 'USER_EXISTS', data: {email: 'taken@example.com'}},
        allowedErrorCodes: ['USER_EXISTS'],
    });

    assert.equal(result.code, 'USER_EXISTS');

    if (result.code === 'USER_EXISTS') {

        assert.equal((result as {data?: {email: string}}).data?.email, 'taken@example.com');

    }

});

test('resolveRouteClientError: 502 HTML maps to SERVICE_UNAVAILABLE via status', (assert) => {

    const result = resolveRouteClientError({
        status: 502,
        body: '<html><body>502 Bad Gateway</body></html>',
    });

    assert.equal(result.code, BUILTIN_ERROR.SERVICE_UNAVAILABLE);

});

test('resolveRouteClientError: unmapped 500 yields UNKNOWN_ERROR with raw body and headers', (assert) => {

    const body = '<html>something weird</html>';
    const headers = new Headers({
        'Content-Type': 'text/html',
        'Server': 'nginx',
    });

    const result = resolveRouteClientError({
        status: 500,
        body,
        responseHeaders: headers,
    });

    assert.equal(result.code, CLIENT_ERROR.UNKNOWN_ERROR);

    if (result.code === CLIENT_ERROR.UNKNOWN_ERROR) {

        assert.equal(result.data.body, body);
        assert.equal(result.data.headers?.['content-type'], 'text/html');
        assert.equal(result.data.headers?.server, 'nginx');

    }

});

test('resolveRouteClientError: INTERNAL_ERROR only when server sends it', (assert) => {

    const result = resolveRouteClientError({
        status: 500,
        body: {error: 'INTERNAL_ERROR'},
    });

    assert.equal(result.code, BUILTIN_ERROR.INTERNAL_ERROR);

});

test('resolveRouteClientError: plain internal error text does not map to INTERNAL_ERROR', (assert) => {

    const result = resolveRouteClientError({
        status: 500,
        body: 'internal error',
    });

    assert.equal(result.code, CLIENT_ERROR.UNKNOWN_ERROR);

});

test('resolveRouteClientError: malformed TOO_MANY_REQUESTS JSON yields UNKNOWN_ERROR', (assert) => {

    const body = {error: 'TOO_MANY_REQUESTS'};
    const result = resolveRouteClientError({
        status: 429,
        body,
    });

    assert.equal(result.code, CLIENT_ERROR.UNKNOWN_ERROR);

    if (result.code === CLIENT_ERROR.UNKNOWN_ERROR) {

        assert.equal(result.data.body, body);

    }

});

test('normalizeClientErrorBody: fuzzy bad gateway phrase', (assert) => {

    const result = normalizeClientErrorBody(400, 'Bad Gateway');

    assert.equal(result.code, BUILTIN_ERROR.SERVICE_UNAVAILABLE);

});
