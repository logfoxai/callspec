import {test} from 'kizu';
import {errorWireExample, exampleFromSchema} from './exampleFromSchema';

test('exampleFromSchema: builds object from JSON schema properties', (assert) => {

    const example = exampleFromSchema({
        type: 'object',
        required: ['message'],
        properties: {
            message: {type: 'string'},
            dryRun: {type: 'boolean'},
        },
    });

    assert.equal(JSON.stringify(example), JSON.stringify({message: '', dryRun: false}));

});

test('exampleFromSchema: uses enum and const values', (assert) => {

    assert.equal(exampleFromSchema({type: 'string', enum: ['a', 'b']}), 'a');
    assert.equal(exampleFromSchema({const: 42}), 42);

});

test('errorWireExample: wraps data schema in wire envelope', (assert) => {

    assert.equal(JSON.stringify(errorWireExample('NOT_FOUND')), JSON.stringify({error: 'NOT_FOUND'}));
    assert.equal(JSON.stringify(errorWireExample('RATE_LIMIT', {
        type: 'object',
        properties: {retryAfterMs: {type: 'integer'}},
        required: ['retryAfterMs'],
    })), JSON.stringify({
        error: 'RATE_LIMIT',
        data: {retryAfterMs: 0},
    }));

});
