import {test} from 'kizu';
import {COPY_FEEDBACK_MS, copyButtonContent, fileKindFromName} from './codeBlockTitles';

test('copyButtonContent matches app-frontend idle / copied labels', (assert) => {
    assert.equal(copyButtonContent(false), {label: 'Copy', state: 'idle'});
    assert.equal(copyButtonContent(true), {label: 'Copied!', state: 'copied'});
});

test('COPY_FEEDBACK_MS matches useCopyToClipboard reset window', (assert) => {
    assert.equal(COPY_FEEDBACK_MS, 1500);
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
