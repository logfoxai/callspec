import {logger} from 'jsout';

export type CallSurface = 'mcp' | 'rpc';

export type CallOutcome = {ok: true} | {ok: false, code: string};

export type CallEvent = {
	surface: CallSurface
	/** Route key (RPC) or MCP tool name. */
	route: string
	durationMs: number
	outcome: 'ok' | 'error'
	/** Present when `outcome` is `error` (builtin/domain code or synthetic tool error). */
	code?: string
};

/** Extension point for Logfox or custom sinks. */
export type OnCall = (event: CallEvent) => void;

export function toCallEvent(input: {
	surface: CallSurface
	route: string
	durationMs: number
	outcome: CallOutcome
}): CallEvent {
	const durationMs = Math.round(input.durationMs);
	if (input.outcome.ok) {
		return {
			surface: input.surface,
			route: input.route,
			durationMs,
			outcome: 'ok',
		};
	}
	return {
		surface: input.surface,
		route: input.route,
		durationMs,
		outcome: 'error',
		code: input.outcome.code,
	};
}

/** Default sink — structured jsout info line. Does not replace HTTP access logs. */
export function defaultLogCall(event: CallEvent): void {
	logger.info('call', event);
}

export function notifyCall(
	onCall: OnCall | undefined,
	input: {
		surface: CallSurface
		route: string
		startedAt: number
		outcome: CallOutcome
	},
): void {
	if (!onCall) return;
	onCall(
		toCallEvent({
			surface: input.surface,
			route: input.route,
			durationMs: performance.now() - input.startedAt,
			outcome: input.outcome,
		}),
	);
}
