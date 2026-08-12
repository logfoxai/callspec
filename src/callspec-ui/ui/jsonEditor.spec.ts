import {test} from 'kizu';
import {
    JSON_EDITOR_DEFAULT_HEIGHT_PX,
    JSON_EDITOR_MAX_DRAG_HEIGHT_PX,
    JSON_EDITOR_MIN_HEIGHT_PX,
    jsonEditorHtml,
    resolveJsonEditorFrameHeight,
    tryFormatJson,
} from './jsonEditor';

test('resolveJsonEditorFrameHeight: user shrink below content height sticks', (assert) => {

    // ~4 lines of JSON → content taller than MIN; user dragged smaller.
    const lines = 8;
    const contentish = resolveJsonEditorFrameHeight({lines});
    const shrunk = JSON_EDITOR_MIN_HEIGHT_PX;

    assert.equal(contentish > shrunk, true, 'default grows with content');
    assert.equal(contentish >= JSON_EDITOR_DEFAULT_HEIGHT_PX, true);
    assert.equal(
        resolveJsonEditorFrameHeight({lines, userHeight: shrunk}),
        shrunk,
        'drag-smaller must not snap back to content height',
    );
    assert.equal(
        resolveJsonEditorFrameHeight({lines, userHeight: JSON_EDITOR_MAX_DRAG_HEIGHT_PX + 100}),
        JSON_EDITOR_MAX_DRAG_HEIGHT_PX,
        'drag clamps to max',
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
