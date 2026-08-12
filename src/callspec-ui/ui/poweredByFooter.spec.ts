import {test} from 'kizu';
import {shouldShowPoweredByFooter} from './poweredByFooter';

test('powered-by footer defaults on; only off when poweredBy is false', (assert) => {

    assert.equal(shouldShowPoweredByFooter(undefined), true);
    assert.equal(shouldShowPoweredByFooter(true), true);
    assert.equal(shouldShowPoweredByFooter(false), false);

});
