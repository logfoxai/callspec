import {test} from 'kizu';
import {shouldShowMarketingPile} from './splashHeroMode';

test('shouldShowMarketingPile: home splash only (Starlight root id is empty)', (assert) => {
	assert.equal(shouldShowMarketingPile(''), true);
	assert.equal(shouldShowMarketingPile('index'), true);
	assert.equal(shouldShowMarketingPile('404'), false);
	assert.equal(shouldShowMarketingPile('getting-started'), false);
});
