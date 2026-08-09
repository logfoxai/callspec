import {test} from 'kizu';
import {
    CUSTOM_CSS_MAX_BYTES,
    sanitizeCustomCss,
    sanitizeHeaderHtml,
} from './uiEscapeHatches';

test('sanitizeCustomCss: strips closing style tag sequences (case-insensitive)', (assert) => {

    const css = 'body{color:red}</style><script>alert(1)</script><style>a{}';

    assert.equal(sanitizeCustomCss(css).includes('</style'), false);
    assert.equal(sanitizeCustomCss(css).includes('</STYLE'), false);
    assert.equal(sanitizeCustomCss('x</Style>y').includes('</Style'), false);

});

test('sanitizeCustomCss: truncates to CUSTOM_CSS_MAX_BYTES UTF-8 bytes', (assert) => {

    const css = 'a'.repeat(CUSTOM_CSS_MAX_BYTES + 64);
    const out = sanitizeCustomCss(css);

    assert.equal(Buffer.byteLength(out, 'utf8'), CUSTOM_CSS_MAX_BYTES);
    assert.equal(out, 'a'.repeat(CUSTOM_CSS_MAX_BYTES));

});

test('sanitizeCustomCss: empty / non-string yields empty string', (assert) => {

    assert.equal(sanitizeCustomCss(''), '');
    assert.equal(sanitizeCustomCss('  \n  '), '  \n  ');

});

test('sanitizeHeaderHtml: strips script tags', (assert) => {

    const html = '<div>ok</div><script>alert(1)</script><p>x</p><script src="x.js"></script>';

    assert.equal(sanitizeHeaderHtml(html).includes('<script'), false);
    assert.equal(sanitizeHeaderHtml(html).includes('alert'), false);
    assert.equal(sanitizeHeaderHtml(html).includes('<div>ok</div>'), true);
    assert.equal(sanitizeHeaderHtml(html).includes('<p>x</p>'), true);

});

test('sanitizeHeaderHtml: strips on* event attributes', (assert) => {

    const html = '<a href="/x" onclick="evil()">Go</a><img src="a.png" onerror=alert(1) alt="a">';
    const out = sanitizeHeaderHtml(html);

    assert.equal(/on\w+\s*=/i.test(out), false);
    assert.equal(out.includes('href="/x"'), true);
    assert.equal(out.includes('alt="a"'), true);

});

test('sanitizeHeaderHtml: strips on* handlers without leading whitespace', (assert) => {

    const html = '<svg/onload=alert(1)><img/src/onerror=alert(2)>';
    const out = sanitizeHeaderHtml(html);

    assert.equal(/on\w+\s*=/i.test(out), false);

});

test('sanitizeHeaderHtml: strips base tags that would hijack relative fetches', (assert) => {

    const html = '<base href="https://evil.example/"><nav>Acme</nav>';
    const out = sanitizeHeaderHtml(html);

    assert.equal(/<base\b/i.test(out), false);
    assert.equal(out.includes('<nav>Acme</nav>'), true);

});

test('sanitizeHeaderHtml: strips javascript: URLs', (assert) => {

    const html = '<a href="javascript:alert(1)">x</a><a href="HTTPS://ok.example">y</a>';
    const out = sanitizeHeaderHtml(html);

    assert.equal(/javascript:/i.test(out), false);
    assert.equal(out.includes('HTTPS://ok.example'), true);

});

test('sanitizeHeaderHtml: strips entity-encoded javascript: URLs', (assert) => {

    const html = '<a href="&#106;avascript:alert(1)">x</a><a href="&#x6A;avascript:alert(2)">y</a>';
    const out = sanitizeHeaderHtml(html);

    assert.equal(/javascript:/i.test(out), false);
    assert.equal(/&#x?0*106;?avascript/i.test(out), false);
    assert.equal(/&#x?0*6a;?avascript/i.test(out), false);

});
