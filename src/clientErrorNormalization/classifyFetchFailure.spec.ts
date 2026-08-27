import {test} from 'kizu';
import {BUILTIN_ERROR, CLIENT_ERROR} from '../client';
import {classifyFetchFailure} from './classifyFetchFailure';

test('classifyFetchFailure: offline and online Failed to fetch', (assert) => {

    const originalNavigator = globalThis.navigator;

    Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: {onLine: false},
    });

    try {

        const offline = classifyFetchFailure(new TypeError('Failed to fetch'));

        assert.equal(offline.status, 0);
        assert.equal(offline.code, CLIENT_ERROR.NETWORK_ERROR);

        Object.defineProperty(globalThis, 'navigator', {
            configurable: true,
            value: {onLine: true},
        });

        const online = classifyFetchFailure(new TypeError('Failed to fetch'));

        assert.equal(online.status, 503);
        assert.equal(online.code, BUILTIN_ERROR.SERVICE_UNAVAILABLE);

    } finally {

        Object.defineProperty(globalThis, 'navigator', {
            configurable: true,
            value: originalNavigator,
        });

    }

});

test('classifyFetchFailure: ECONNREFUSED maps to SERVICE_UNAVAILABLE', (assert) => {

    const err = new Error('fetch failed') as Error & {cause: {code: string}};

    err.cause = {code: 'ECONNREFUSED'};

    const result = classifyFetchFailure(err);

    assert.equal(result.status, 503);
    assert.equal(result.code, BUILTIN_ERROR.SERVICE_UNAVAILABLE);

});

test('classifyFetchFailure: connection refused message maps to SERVICE_UNAVAILABLE', (assert) => {

    const result = classifyFetchFailure(new Error('connect ECONNREFUSED 127.0.0.1:3000'));

    assert.equal(result.status, 503);
    assert.equal(result.code, BUILTIN_ERROR.SERVICE_UNAVAILABLE);

});

test('classifyFetchFailure: AbortError maps to NETWORK_ERROR', (assert) => {

    const err = new Error('The user aborted a request.');

    err.name = 'AbortError';

    const result = classifyFetchFailure(err);

    assert.equal(result.status, 0);
    assert.equal(result.code, CLIENT_ERROR.NETWORK_ERROR);

});
