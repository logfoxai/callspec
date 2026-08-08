import {readFileSync, existsSync} from 'node:fs';
import path from 'node:path';
import {test} from 'kizu';
import {route} from './route';
import {predicates as p} from 'runtyp';

const root = process.cwd();

test('route() accepts handler and exposes .handler (not resolver)', (assert) => {
	const wired = route({
		input: p.object({}),
		output: p.object({ok: p.boolean()}),
		meta: {summary: 'Ping', tags: []},
		auth: 'none',
		handler: async (_input, _ctx) => ({ok: true}),
	});

	assert.equal(typeof wired.handler, 'function');
	assert.equal(
		Object.prototype.hasOwnProperty.call(wired, 'resolver'),
		false,
		'wired route must not expose resolver',
	);
});

test('public API and docs use handler naming', (assert) => {
	const index = readFileSync(path.join(root, 'src/index.ts'), 'utf8');
	assert.equal(index.includes('RouteResolver'), false);
	assert.equal(index.includes('ResolverFor'), false);
	assert.equal(index.includes('RouteHandler'), true);
	assert.equal(index.includes('HandlerFor'), true);

	assert.equal(existsSync(path.join(root, 'src/routeHandler.ts')), true);
	assert.equal(existsSync(path.join(root, 'src/routeResolver.ts')), false);
	assert.equal(
		existsSync(path.join(root, 'src/content/docs/api-reference/handlers.md')),
		true,
	);
	assert.equal(
		existsSync(path.join(root, 'src/content/docs/api-reference/resolvers.md')),
		false,
	);

	const astro = readFileSync(path.join(root, 'astro.config.mjs'), 'utf8');
	assert.equal(astro.includes('api-reference/resolvers'), false);
	assert.equal(astro.includes('api-reference/handlers'), true);
});
