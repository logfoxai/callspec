import {test} from 'kizu';
import {
    jsonEditorHtml,
    resolveJsonEditorFrameHeight,
    tryFormatJson,
} from './jsonEditor';

test('resolveJsonEditorFrameHeight: user shrink below content height sticks', (assert) => {

    // ~4 lines of JSON → content taller than MIN; user dragged smaller.
    const lines = 8;
    const contentish = resolveJsonEditorFrameHeight({lines});
    const shrunk = 160;

    assert.equal(contentish > shrunk, true, 'default grows with content');
    assert.equal(
        resolveJsonEditorFrameHeight({lines, userHeight: shrunk}),
        shrunk,
        'drag-smaller must not snap back to content height',
    );

});

test('tryFormatJson pretty-prints valid JSON and leaves invalid alone', (assert) => {

    assert.equal(tryFormatJson('{"a":1}'), '{\n  "a": 1\n}');
    assert.equal(tryFormatJson('{nope'), null);

});

test('jsonEditorHtml: no Format button; keeps status', (assert) => {

    const html = jsonEditorHtml('body', '{\n  "a": 1\n}');

    assert.equal(html.includes('data-json-format'), false);
    assert.equal(html.includes('Format</button>'), false);
    assert.equal(html.includes('data-json-status'), true);
    assert.equal(html.includes('data-json-resize'), true);

});
