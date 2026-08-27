import {test} from 'kizu';
import {
    COPY_FEEDBACK_MS,
    copyButtonContent,
    copyButtonMarkup,
    defaultTitleFromLang,
    ecDataCodeToText,
    fileKindFromName,
    isFilePathTitle,
    kindFromTitle,
    tryCopyText,
} from './codeBlockTitles';

test('copyButtonContent idle and copied labels', (assert) => {
    assert.equal(copyButtonContent(false), {label: 'Copy', state: 'idle'});
    assert.equal(copyButtonContent(true), {label: 'Copied!', state: 'copied'});
});

test('copyButtonContent keeps a custom idle label after Copied!', (assert) => {
    assert.equal(copyButtonContent(false, 'Copy curl'), {label: 'Copy curl', state: 'idle'});
    assert.equal(copyButtonContent(true, 'Copy curl'), {label: 'Copied!', state: 'copied'});
});

test('copyButtonMarkup is the docs chrome idle control', (assert) => {
    const html = copyButtonMarkup({copyTarget: 'cursor-mcp-config'});
    assert.equal(html.includes('class="cs-copy-btn"'), true);
    assert.equal(html.includes('cs-copy-icon'), true);
    assert.equal(html.includes('cs-copy-label'), true);
    assert.equal(html.includes('Copy to clipboard'), true);
    assert.equal(html.includes('data-copy-target="cursor-mcp-config"'), true);
});

test('copyButtonMarkup accepts id, copy value, and a custom idle label', (assert) => {
    const html = copyButtonMarkup({
        id: 'copy-curl-try',
        copyValue: 'http://127.0.0.1:3000/v1/mcp',
        label: 'Copy curl',
    });
    assert.equal(html.includes('id="copy-curl-try"'), true);
    assert.equal(html.includes('data-copy="http://127.0.0.1:3000/v1/mcp"'), true);
    assert.equal(html.includes('data-cs-copy-idle-label="Copy curl"'), true);
    assert.equal(html.includes('>Copy curl</span>'), true);
    assert.equal(html.includes('class="btn'), false);
});

test('COPY_FEEDBACK_MS is 1500ms', (assert) => {
    assert.equal(COPY_FEEDBACK_MS, 1500);
});

test('ecDataCodeToText turns EC delimiter into newlines', (assert) => {
    assert.equal(ecDataCodeToText(`a\u007fb`), 'a\nb');
    assert.equal(ecDataCodeToText('plain'), 'plain');
});

test('tryCopyText returns true only when write succeeds', async (assert) => {
    assert.equal(await tryCopyText('hi', {writeText: async () => undefined}), true);
    assert.equal(
        await tryCopyText('hi', {
            writeText: async () => {
                throw new Error('denied');
            },
        }),
        false,
    );
    assert.equal(await tryCopyText('', {writeText: async () => undefined}), false);
});

test('defaultTitleFromLang maps fence langs to tab labels', (assert) => {
    assert.equal(defaultTitleFromLang('typescript'), 'typescript');
    assert.equal(defaultTitleFromLang('tsx'), 'tsx');
    assert.equal(defaultTitleFromLang('javascript'), 'javascript');
    assert.equal(defaultTitleFromLang('json'), 'json');
    assert.equal(defaultTitleFromLang('text'), 'text');
    assert.equal(defaultTitleFromLang(''), 'code');
});

test('isFilePathTitle distinguishes filenames from bare lang titles', (assert) => {
    assert.equal(isFilePathTitle('server/routes.ts'), true);
    assert.equal(isFilePathTitle('getProductById.ts'), true);
    assert.equal(isFilePathTitle('typescript'), false);
    assert.equal(isFilePathTitle('bash'), false);
    assert.equal(isFilePathTitle('SKILL.md'), true);
});

test('kindFromTitle maps langs and filenames to chips', (assert) => {
    assert.equal(kindFromTitle('typescript'), 'TS');
    assert.equal(kindFromTitle('tsx'), 'TSX');
    assert.equal(kindFromTitle('server/app.ts'), 'TS');
    assert.equal(kindFromTitle('text'), null);
});

test('fileKindFromName maps common extensions', (assert) => {
    assert.equal(fileKindFromName('getProductById.ts'), 'TS');
    assert.equal(fileKindFromName('App.tsx'), 'TSX');
    assert.equal(fileKindFromName('index.js'), 'JS');
    assert.equal(fileKindFromName('util.mjs'), 'JS');
    assert.equal(fileKindFromName('package.json'), 'JSON');
    assert.equal(fileKindFromName('README.md'), 'MD');
    assert.equal(fileKindFromName('styles.css'), 'CSS');
    assert.equal(fileKindFromName('main.py'), 'PY');
    assert.equal(fileKindFromName('main.go'), 'GO');
});

test('fileKindFromName is case-insensitive and path-aware', (assert) => {
    assert.equal(fileKindFromName('server/routes/Foo.TS'), 'TS');
    assert.equal(fileKindFromName('nested/dir/app.tsx'), 'TSX');
});

test('fileKindFromName returns null for unknown extensions', (assert) => {
    assert.equal(fileKindFromName('Makefile'), null);
    assert.equal(fileKindFromName('notes.txt'), null);
    assert.equal(fileKindFromName(''), null);
});
