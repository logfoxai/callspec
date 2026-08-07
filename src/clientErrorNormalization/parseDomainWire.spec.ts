import {test} from 'kizu';
import {parseDomainErrorFromWire} from './parseDomainWire';

const userExistsParsing = {
    allowedErrorCodes: ['USER_EXISTS'],
    domainErrors: {
        USER_EXISTS: {
            dataRequired: true,
            data: {
                type: 'object',
                properties: {email: {type: 'string'}},
                required: ['email'],
            },
        },
    },
} as const;

test('parseDomainErrorFromWire: valid payload', (assert) => {

    const result = parseDomainErrorFromWire(
        {error: 'USER_EXISTS', data: {email: 'taken@example.com'}},
        userExistsParsing,
    );

    assert.equal(result?.code, 'USER_EXISTS');
    assert.equal((result as {data?: {email: string}})?.data?.email, 'taken@example.com');

});

test('parseDomainErrorFromWire: missing required data returns undefined', (assert) => {

    const result = parseDomainErrorFromWire(
        {error: 'USER_EXISTS'},
        userExistsParsing,
    );

    assert.equal(result, undefined);

});

test('parseDomainErrorFromWire: code without domainErrors contract returns undefined', (assert) => {

    const result = parseDomainErrorFromWire(
        {error: 'USER_EXISTS', data: {email: 'taken@example.com'}},
        {allowedErrorCodes: ['USER_EXISTS']},
    );

    assert.equal(result, undefined);

});
