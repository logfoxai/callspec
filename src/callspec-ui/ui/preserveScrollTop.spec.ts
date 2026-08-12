import {test} from 'kizu';
import {readScrollTop, writeScrollTop} from './preserveScrollTop';

test('readScrollTop returns 0 for missing elements', (assert) => {

    assert.equal(readScrollTop(null), 0);
    assert.equal(readScrollTop(undefined), 0);

});

test('writeScrollTop restores in-memory position (no sessionStorage)', (assert) => {

    const el = {scrollTop: 240};
    const saved = readScrollTop(el);

    el.scrollTop = 0; // simulate innerHTML rebuild
    writeScrollTop(el, saved);

    assert.equal(el.scrollTop, 240);
    assert.equal(saved, 240);

});
