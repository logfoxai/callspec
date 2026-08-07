import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';

const dir = dirname(fileURLToPath(import.meta.url));
const flow = readFileSync(join(dir, 'SplashFlow.astro'), 'utf8');
const css = readFileSync(join(dir, '../styles/splash.css'), 'utf8');

test('serve-it-all surfaces are big, drop auth note, use MCP mark', (assert) => {
	assert.equal(
		flow.includes('Auth, typed errors'),
		false,
		'auth footer note should be removed',
	);
	assert.equal(
		flow.includes("icon: 'star'"),
		false,
		'star is not the MCP mark',
	);
	assert.equal(
		flow.includes("icon: 'mcp'") && flow.includes('surfaceIcons') && /mcp:\s*`<svg/.test(flow),
		true,
		'MCP row uses the official connector mark',
	);
	assert.equal(
		/\.splash-flow__icon\s*\{[^}]*background:/.test(css),
		false,
		'icons should not sit in background boxes',
	);
	assert.equal(
		/\.splash-flow__icon\s*\{[\s\S]*?svg\s*\{[\s\S]*?width:\s*1\.(4|5|6)/.test(css),
		true,
		'surface icons should be larger than the original ~1.15rem',
	);
	assert.equal(
		/\.splash-flow__surface-label\s*\{[\s\S]*?font-size:\s*1/.test(css),
		true,
		'surface labels should read at ~1rem+',
	);
});
