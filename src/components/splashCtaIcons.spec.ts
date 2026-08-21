import {test} from 'kizu';
import {isDemoLink, withDemoLinkOpenAttrs} from './splashCtaIcons';

test('isDemoLink: only the Chirp explorer path', (assert) => {
    assert.equal(isDemoLink('/demo/'), true);
    assert.equal(isDemoLink('/demo'), true);
    assert.equal(isDemoLink('/demo/#routes'), true);
    assert.equal(isDemoLink('https://callspec.logfox.ai/demo/'), true);
    assert.equal(isDemoLink('/getting-started/'), false);
    assert.equal(isDemoLink('/development/'), false);
    assert.equal(isDemoLink('/try-the-demo-locally/'), false);
    assert.equal(isDemoLink('/demo/callspec.json'), false);
});

test('withDemoLinkOpenAttrs: demo links always open a new tab', (assert) => {
    assert.equal(withDemoLinkOpenAttrs('/demo/', {class: 'cta'}), {
        class: 'cta',
        target: '_blank',
        rel: 'noopener noreferrer',
    });
    assert.equal(withDemoLinkOpenAttrs('/getting-started/', {title: 'Start'}), {
        title: 'Start',
    });
});
