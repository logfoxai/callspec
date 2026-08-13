import {test} from 'kizu';
import {DEMO_MODE_TOOLTIP, renderTryItPanel} from './tryItPanel';

test('renderTryItPanel: demo mode disables Send with tooltip wrapper', (assert) => {

    const html = renderTryItPanel({
        route: {auth: 'bearer'},
        bodyJson: '{}',
        authToken: 'demo',
        demoMode: true,
    });

    assert.equal(html.includes('try-send-wrap'), true);
    assert.equal(html.includes(`title="${DEMO_MODE_TOOLTIP}"`), true);
    assert.equal(html.includes('id="send" disabled'), true);
    assert.equal(html.includes('id="copy-curl-try" disabled'), false);
    assert.equal(html.includes('readonly'), false);

});

test('renderTryItPanel: live mode keeps Send enabled', (assert) => {

    const html = renderTryItPanel({
        route: {auth: 'none'},
        bodyJson: '{}',
        authToken: '',
        demoMode: false,
    });

    assert.equal(html.includes('try-send-wrap'), false);
    assert.equal(html.includes(' disabled'), false);
    assert.equal(html.includes('id="send">Send</button>'), true);

});
