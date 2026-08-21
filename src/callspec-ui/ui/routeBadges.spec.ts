import {test} from 'kizu';
import {renderRouteBadges} from './routeBadges';

test('renderRouteBadges: auth and MCP labels by default', (assert) => {

    const html = renderRouteBadges({auth: 'bearer', mcp: true});

    assert.equal(html.includes('route-badge--bearer'), true);
    assert.equal(html.includes('route-badge--mcp'), true);
    assert.equal(html.includes('icon-label__label">Bearer'), true);
    assert.equal(html.includes('icon-label__label">MCP'), true);

});

test('renderRouteBadges: icon-only badges for compact sidebar', (assert) => {

    const html = renderRouteBadges({auth: 'none', mcp: true}, {labels: false});

    assert.equal(html.includes('icon-label__label'), false);
    assert.equal(html.includes('route-badge--none'), true);
    assert.equal(html.includes('route-badge--mcp'), true);
    assert.equal(html.includes('aria-label="No authentication required"'), true);
    assert.equal(html.includes('aria-label="MCP tool"'), true);

});
