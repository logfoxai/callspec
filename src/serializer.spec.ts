import {test} from 'kizu';
import {predicates as p} from 'runtyp';
import {
    deserializeResponse,
    deserializeWithPred,
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

test('deserializeWithPred coerces ISO only at p.date() leaves', (assert) => {

    const pred = p.object({
        time: p.date(),
        label: p.string(),
    });
    const out = deserializeWithPred({time: ISO, label: ISO}, pred) as {
        time: Date
        label: string
    };

    assert.equal(out.time instanceof Date, true);
    assert.equal(out.time.toISOString(), ISO);
    assert.equal(out.label, ISO);
    assert.equal(typeof out.label, 'string');

});

test('deserializeWithPred accepts legacy Date wire at p.date() leaves', (assert) => {

    const pred = p.object({at: p.date()});
    const out = deserializeWithPred({
        at: {__type: 'Date', value: ISO},
    }, pred) as {at: Date};

    assert.equal(out.at instanceof Date, true);
    assert.equal(out.at.toISOString(), ISO);

});

test('deserializeWithPred leaves ISO strings alone for p.string()', (assert) => {

    const pred = p.object({created_at: p.string()});
    const input = {created_at: ISO};
    const out = deserializeWithPred(input, pred);

    assert.equal(out, input);
    assert.equal((out as {created_at: string}).created_at, ISO);

});

test('deserializeWithPred revives dates inside arrays of dates', (assert) => {

    const pred = p.object({times: p.array(p.date())});
    const out = deserializeWithPred({times: [ISO, ISO]}, pred) as {times: Date[]};

    assert.equal(out.times.length, 2);
    assert.equal(out.times.every((d) => d instanceof Date), true);

});

test('deserializeWithPred does not coerce ISO strings inside string arrays', (assert) => {

    const pred = p.object({ids: p.array(p.string())});
    const input = {ids: [ISO, 'sku-1']};
    const out = deserializeWithPred(input, pred) as {ids: string[]};

    assert.equal(out.ids[0], ISO);
    assert.equal(typeof out.ids[0], 'string');
    assert.equal(out.ids[1], 'sku-1');

});

test('deserializeWithPred handles optional date', (assert) => {

    const pred = p.object({at: p.optional(p.date())});
    const out = deserializeWithPred({at: ISO}, pred) as {at?: Date};

    assert.equal(out.at instanceof Date, true);

});

test('deserializeWithPred union prefers branch that validates after coerce', (assert) => {

    const pred = p.union([
        p.object({kind: p.literal('when'), at: p.date()}),
        p.object({kind: p.literal('text'), body: p.string()}),
    ]);

    const when = deserializeWithPred({kind: 'when', at: ISO}, pred) as {
        kind: 'when'
        at: Date
    };
    const text = deserializeWithPred({kind: 'text', body: ISO}, pred) as {
        kind: 'text'
        body: string
    };

    assert.equal(when.at instanceof Date, true);
    assert.equal(text.body, ISO);
    assert.equal(typeof text.body, 'string');

});

test('deserializeResponse without pred only revives legacy Date wrappers', (assert) => {

    const legacy = deserializeResponse({at: {__type: 'Date', value: ISO}}) as {at: Date};
    const bare = deserializeResponse({at: ISO}) as {at: string};

    assert.equal(legacy.at instanceof Date, true);
    assert.equal(bare.at, ISO);
    assert.equal(typeof bare.at, 'string');

});

test('deserializeResponse leaves non-date payloads by reference', (assert) => {

    const input = {id: 'sku-1', label: 'hello', n: 3, ok: true, nil: null};

    assert.equal(deserializeResponse(input), input);

});

test('serializeResponse emits ISO strings for Date values', (assert) => {

    assert.equal(serializeResponse(new Date(ISO)), ISO);

});

test('serializeResponse round-trips with deserializeWithPred', (assert) => {

    const pred = p.object({time: p.date(), nested: p.object({at: p.date()})});
    const d = new Date(ISO);
    const wire = serializeResponse({time: d, nested: {at: d}});
    const revived = deserializeWithPred(wire, pred) as {
        time: Date
        nested: {at: Date}
    };

    assert.equal(revived.time instanceof Date, true);
    assert.equal(revived.nested.at instanceof Date, true);
    assert.equal(revived.time.toISOString(), ISO);

});

test('deserializeWithPred returns same reference when nothing changes', (assert) => {

    const pred = p.object({
        a: p.string(),
        b: p.number(),
    });
    const payload: Record<string, unknown> = {a: 'x', b: 1};

    for (let i = 0; i < 1_000; i++) {

        payload[`k${i}`] = `value-${i}`;

    }

    // Pred only knows a/b — unknown keys stay as-is; no date leaves → same ref for known walk
    const small = {a: 'x', b: 1};
    assert.equal(deserializeWithPred(small, pred), small);

});
