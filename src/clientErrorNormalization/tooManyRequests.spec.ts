import {test} from 'kizu';
import {BUILTIN_ERROR} from '../builtinErrors';
import {parseTooManyRequestsFromWire} from './tooManyRequests';
import {matchBuiltinByStatus} from './matchBuiltinHeuristics';

test('parseTooManyRequestsFromWire: bare callspec JSON has code only', (assert) => {

    const result = parseTooManyRequestsFromWire({error: 'TOO_MANY_REQUESTS'});

    assert.equal(result?.code, BUILTIN_ERROR.TOO_MANY_REQUESTS);
    assert.equal(result?.data, undefined);

});

test('parseTooManyRequestsFromWire: keeps only wire payload fields', (assert) => {

    const result = parseTooManyRequestsFromWire({message: 'Try again later'});

    assert.equal(result?.code, BUILTIN_ERROR.TOO_MANY_REQUESTS);
    assert.equal(result?.data?.message, 'Try again later');
    assert.equal(result?.data?.title, undefined);

});

test('matchBuiltinByStatus: 429 without body maps to code only', (assert) => {

    const result = matchBuiltinByStatus(429, '');

    assert.equal(result?.code, BUILTIN_ERROR.TOO_MANY_REQUESTS);
    assert.equal(result?.data, undefined);

});

test('matchBuiltinByStatus: 502 maps to SERVICE_UNAVAILABLE', (assert) => {

    const result = matchBuiltinByStatus(502, '<html>502 Bad Gateway</html>');

    assert.equal(result?.code, BUILTIN_ERROR.SERVICE_UNAVAILABLE);

});

test('matchBuiltinByStatus: 409 is not a builtin (no CONFLICT)', (assert) => {

    const result = matchBuiltinByStatus(409, '');

    assert.equal(result, undefined);

});
