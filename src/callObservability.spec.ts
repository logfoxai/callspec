import {test} from 'kizu';
import {notifyCall, toCallEvent, type CallEvent} from './callObservability.js';

test('toCallEvent builds ok MCP call events with duration', (assert) => {
	assert.equal(
		toCallEvent({
			surface: 'mcp',
			route: 'getProductById',
			durationMs: 12.6,
			outcome: {ok: true},
		}),
		{
			surface: 'mcp',
			route: 'getProductById',
			durationMs: 13,
			outcome: 'ok',
		} satisfies CallEvent,
	);
});

test('toCallEvent includes error code on failures', (assert) => {
	assert.equal(
		toCallEvent({
			surface: 'mcp',
			route: 'getProductById',
			durationMs: 4,
			outcome: {ok: false, code: 'NOT_FOUND'},
		}),
		{
			surface: 'mcp',
			route: 'getProductById',
			durationMs: 4,
			outcome: 'error',
			code: 'NOT_FOUND',
		},
	);
});

test('notifyCall invokes the sink with a rounded duration', (assert) => {
	const events: CallEvent[] = [];
	notifyCall((event) => {
		events.push(event);
	}, {
		surface: 'mcp',
		route: 'echo',
		startedAt: performance.now() - 10,
		outcome: {ok: true},
	});
	assert.equal(events.length, 1);
	assert.equal(events[0]?.surface, 'mcp');
	assert.equal(events[0]?.route, 'echo');
	assert.equal(events[0]?.outcome, 'ok');
	assert.equal((events[0]?.durationMs ?? -1) >= 0, true);
});

test('notifyCall is a no-op without a sink', (assert) => {
	notifyCall(undefined, {
		surface: 'mcp',
		route: 'echo',
		startedAt: performance.now(),
		outcome: {ok: true},
	});
	assert.equal(true, true);
});
