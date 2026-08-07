import {test} from 'kizu';
import {parseDomainErrorPayload, validateDomainErrorData} from './clientErrorDataValidation';

test('validateDomainErrorData: accepts valid required object payload', (assert) => {

    const result = validateDomainErrorData(
        {
            dataRequired: true,
            data: {
                type: 'object',
                properties: {email: {type: 'string'}},
                required: ['email'],
                additionalProperties: false,
            },
        },
        {email: 'taken@example.com'},
    );

    assert.equal(result.isValid, true);

    if (result.isValid) {

        assert.equal((result.value as {email: string}).email, 'taken@example.com');

    }

});

test('parseDomainErrorPayload: rejects missing required payload', (assert) => {

    const result = parseDomainErrorPayload(
        {
            dataRequired: true,
            data: {
                type: 'object',
                properties: {email: {type: 'string'}},
                required: ['email'],
            },
        },
        undefined,
    );

    assert.equal(result.ok, false);

});

test('validateDomainErrorData: rejects invalid field types', (assert) => {

    const result = validateDomainErrorData(
        {
            dataRequired: true,
            data: {
                type: 'object',
                properties: {email: {type: 'string'}},
                required: ['email'],
            },
        },
        {email: 123},
    );

    assert.equal(result.isValid, false);

});

test('validateDomainErrorData: code-only domain error rejects unexpected data', (assert) => {

    const result = validateDomainErrorData(
        {dataRequired: false},
        {email: 'taken@example.com'},
    );

    assert.equal(result.isValid, false);

});
