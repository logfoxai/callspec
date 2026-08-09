import {test} from 'kizu';
import {
    metaBrandingFromCallspecMeta,
    relativeToMountPath,
    relativeToMountRoot,
    siblingSpecPath,
} from './metaDefaults';

test('metaBrandingFromCallspecMeta: passes theme, navbarLinks, footer, favicon', (assert) => {

    const branding = metaBrandingFromCallspecMeta({
        title: 'Acme API',
        intro: 'Welcome',
        website: {url: 'https://acme.example', label: 'acme.example'},
        logo: {light: './brand/light.svg', dark: './brand/dark.svg'},
        favicon: './brand/favicon.ico',
        theme: {
            accent: '#0ea5e9',
            background: '#fff',
            surface: '#f8fafc',
            fontFamily: 'Inter, sans-serif',
            fontUrls: ['https://fonts.example/inter.css'],
        },
        navbarLinks: [
            {label: 'Dashboard', href: 'https://app.acme.example'},
            {label: 'GitHub', href: 'https://github.com/acme', external: true},
        ],
        footer: {poweredBy: false},
        headerHtml: '<div class="mkt">Acme</div>',
        authHint: 'Use a portal key.',
    });

    assert.equal(branding.name, 'Acme API');
    assert.equal(branding.intro, 'Welcome');
    assert.equal(branding.websiteUrl, 'https://acme.example');
    assert.equal(branding.websiteLabel, 'acme.example');
    assert.equal(branding.logoUrl, './brand/light.svg');
    assert.equal(branding.logoUrlDark, './brand/dark.svg');
    assert.equal(branding.favicon, './brand/favicon.ico');
    assert.equal(branding.theme, {
        accent: '#0ea5e9',
        background: '#fff',
        surface: '#f8fafc',
        fontFamily: 'Inter, sans-serif',
        fontUrls: ['https://fonts.example/inter.css'],
    });
    assert.equal(branding.navbarLinks, [
        {label: 'Dashboard', href: 'https://app.acme.example'},
        {label: 'GitHub', href: 'https://github.com/acme', external: true},
    ]);
    assert.equal(branding.footer, {poweredBy: false});
    assert.equal(branding.headerHtml, '<div class="mkt">Acme</div>');
    assert.equal(branding.mcp, {authHint: 'Use a portal key.'});

});

test('metaBrandingFromCallspecMeta: favicon defaults to logo.light', (assert) => {

    const branding = metaBrandingFromCallspecMeta({
        title: 'Acme API',
        logo: {light: './brand/mark.svg'},
    });

    assert.equal(branding.favicon, './brand/mark.svg');

});

test('metaBrandingFromCallspecMeta: omits optional branding when unset', (assert) => {

    const branding = metaBrandingFromCallspecMeta({title: 'Bare API'});

    assert.equal(branding.name, 'Bare API');
    assert.equal(branding.favicon, undefined);
    assert.equal(branding.theme, undefined);
    assert.equal(branding.navbarLinks, undefined);
    assert.equal(branding.footer, undefined);
    assert.equal(branding.headerHtml, undefined);
    assert.equal(branding.sdkInstall, undefined);

});

test('metaBrandingFromCallspecMeta: passes sdkInstall', (assert) => {

    const branding = metaBrandingFromCallspecMeta({
        title: 'Acme API',
        sdkInstall: 'npm i @acme/sdk',
    });

    assert.equal(branding.sdkInstall, 'npm i @acme/sdk');

});

test('siblingSpecPath: relative URL from docs to sibling mount paths', (assert) => {

    assert.equal(siblingSpecPath('/callspec.json'), '../callspec.json');
    assert.equal(siblingSpecPath('/mcp'), '../mcp');
    assert.equal(siblingSpecPath('/api/callspec.json'), '../api/callspec.json');

});

test('relativeToMountRoot: steps up from nested docs paths', (assert) => {

    assert.equal(relativeToMountRoot('/docs'), '..');
    assert.equal(relativeToMountRoot('/explorer'), '..');
    assert.equal(relativeToMountRoot('/admin/api/docs'), '../../..');

});

test('relativeToMountPath: links docs UI to fixed contract paths', (assert) => {

    assert.equal(relativeToMountPath('/docs', '/callspec.json'), '../callspec.json');
    assert.equal(relativeToMountPath('/explorer', '/callspec.json'), '../callspec.json');
    assert.equal(relativeToMountPath('/admin/api/docs', '/callspec.json'), '../../../callspec.json');
    assert.equal(relativeToMountPath('/docs', '/mcp'), '../mcp');

});
