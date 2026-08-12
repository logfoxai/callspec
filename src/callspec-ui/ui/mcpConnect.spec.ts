import {test} from 'kizu';
import {
    claudeCodeMcpCommand,
    mcpServersUrlConfig,
    piMcpConfig,
    serverSlugFromName,
    tokenEnvName,
    vscodeMcpConfig,
    windsurfMcpConfig,
    withPreservedScrollTop,
} from './mcpConnect';

test('withPreservedScrollTop: tab switch must not jump the page scroller', (assert) => {

    const scroller = {scrollTop: 640};

    withPreservedScrollTop(scroller, () => {

        // Simulate layout / focus side effects that zero the content pane.
        scroller.scrollTop = 0;

    });

    assert.equal(scroller.scrollTop, 640);

});

test('serverSlugFromName normalizes display name', (assert) => {

    assert.equal(serverSlugFromName('Chirp API'), 'chirp-api', 'slug');
    assert.equal(tokenEnvName('chirp-api'), 'CHIRP_API_TOKEN', 'token env');

});

test('mcpServersUrlConfig builds Cursor-style config', (assert) => {

    const json = mcpServersUrlConfig('https://api.example.com/v1/mcp', 'chirp', 'Bearer tok');

    assert.equal(json, JSON.stringify({
        mcpServers: {
            chirp: {
                url: 'https://api.example.com/v1/mcp',
                headers: {Authorization: 'Bearer tok'},
            },
        },
    }, null, 2), 'cursor config');

});


test('vscodeMcpConfig uses servers and type http', (assert) => {

    const parsed = JSON.parse(vscodeMcpConfig('https://api.example.com/mcp', 'api')) as {
        servers: Record<string, {type: string, url: string}>
    };

    assert.equal(parsed.servers.api.type, 'http', 'type');
    assert.equal(parsed.servers.api.url, 'https://api.example.com/mcp', 'url');

});

test('windsurfMcpConfig uses serverUrl and env interpolation', (assert) => {

    const parsed = JSON.parse(windsurfMcpConfig('https://api.example.com/mcp', 'chirp', 'CHIRP_API_TOKEN')) as {
        mcpServers: Record<string, {serverUrl: string, headers: Record<string, string>}>
    };

    assert.equal(parsed.mcpServers.chirp.serverUrl, 'https://api.example.com/mcp', 'serverUrl');
    assert.equal(parsed.mcpServers.chirp.headers.Authorization, 'Bearer ${env:CHIRP_API_TOKEN}', 'header');

});

test('piMcpConfig supports optional bearer env', (assert) => {

    const withAuth = JSON.parse(piMcpConfig('https://api.example.com/mcp', 'chirp', 'CHIRP_API_TOKEN')) as {
        mcpServers: Record<string, {auth?: string, bearerTokenEnv?: string}>
    };

    assert.equal(withAuth.mcpServers.chirp.auth, 'bearer', 'auth');
    assert.equal(withAuth.mcpServers.chirp.bearerTokenEnv, 'CHIRP_API_TOKEN', 'env');

    const publicOnly = JSON.parse(piMcpConfig('https://api.example.com/mcp', 'chirp')) as {
        mcpServers: Record<string, {url: string, auth?: string}>
    };

    assert.equal(publicOnly.mcpServers.chirp.url, 'https://api.example.com/mcp', 'url');
    assert.equal(publicOnly.mcpServers.chirp.auth, undefined, 'no auth');

});

test('claudeCodeMcpCommand includes transport and header', (assert) => {

    assert.equal(
        claudeCodeMcpCommand('https://api.example.com/mcp', 'chirp', 'Bearer tok'),
        'claude mcp add --transport http chirp https://api.example.com/mcp --header "Authorization: Bearer tok"',
        'command',
    );

});
