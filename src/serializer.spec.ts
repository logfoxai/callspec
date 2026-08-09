import {test} from 'kizu';
import {
    deserializeResponse,
    parseIsoDateTimeString,
    serializeResponse,
} from './serializer';

const ISO = '2024-01-15T12:00:00.000Z';

test('parseIsoDateTimeString accepts ISO date-time strings', (assert) => {

    const d = parseIsoDateTimeString(ISO);

    assert.equal(d instanceof Date, true);
    assert.equal(d?.toISOString(), ISO);

});

test('parseIsoDateTimeString rejects non-date strings', (assert) => {

    assert.equal(parseIsoDateTimeString('hello'), undefined);
    assert.equal(parseIsoDateTimeString('2024-01-15'), undefined);
    assert.equal(parseIsoDateTimeString(''), undefined);

});

test('deserializeResponse converts ISO strings to Date', (assert) => {

    const out = deserializeResponse({time: ISO}) as {time: Date};

    assert.equal(out.time instanceof Date, true);
    assert.equal(out.time.toISOString(), ISO);

});

test('deserializeResponse accepts legacy Date wire objects', (assert) => {

    const out = deserializeResponse({
        at: {__type: 'Date', value: ISO},
    }) as {at: Date};

    assert.equal(out.at instanceof Date, true);
    assert.equal(out.at.toISOString(), ISO);

});

test('deserializeResponse leaves non-ISO strings unchanged', (assert) => {

    const input = {id: 'sku-1', label: 'hello'};

    assert.equal(deserializeResponse(input), input);

});

test('deserializeResponse leaves numbers and booleans unchanged', (assert) => {

    const input = {n: 3, ok: true, nil: null};

    assert.equal(deserializeResponse(input), input);

});

test('deserializeResponse revives nested dates in arrays', (assert) => {

    const out = deserializeResponse({times: [ISO, 'not-a-date']}) as {times: unknown[]};

    assert.equal(out.times[0] instanceof Date, true);
    assert.equal(out.times[1], 'not-a-date');

});

test('serializeResponse emits ISO strings for Date values', (assert) => {

    assert.equal(serializeResponse(new Date(ISO)), ISO);

});

test('serializeResponse round-trips with deserializeResponse', (assert) => {

    const d = new Date(ISO);
    const wire = serializeResponse({time: d, nested: {at: d}});
    const revived = deserializeResponse(wire) as {time: Date; nested: {at: Date}};

    assert.equal(revived.time instanceof Date, true);
    assert.equal(revived.nested.at instanceof Date, true);
    assert.equal(revived.time.toISOString(), ISO);

});

test('deserializeResponse returns same reference when nothing changes', (assert) => {

    const payload: Record<string, unknown> = {};

    for (let i = 0; i < 10_000; i++) {

        payload[`k${i}`] = `value-${i}`;

    }

    const start = performance.now();

    const out = deserializeResponse(payload);

    const elapsed = performance.now() - start;

    assert.equal(out, payload);
    assert.equal(elapsed < 50, true, `expected fast no-op pass, took ${elapsed}ms`);

});

test('deserializeResponse revives many ISO strings without cloning unchanged siblings', (assert) => {

    const sibling = 'keep-me';
    const payload = {
        sibling,
        dates: Array.from({length: 100}, () => ISO),
    };

    const out = deserializeResponse(payload) as {sibling: string; dates: Date[]};

    assert.equal(out.sibling, sibling);
    assert.equal(out.dates.every((d) => d instanceof Date), true);

});
