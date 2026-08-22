import {test} from 'kizu';
import {bindPagefindMount, type PagefindMountEl} from './pagefindMount.js';

function hostWith(mount: PagefindMountEl | null): {querySelector(selector: string): PagefindMountEl | null} {
	return {
		querySelector(selector: string): PagefindMountEl | null {
			return selector === '[data-cs-pagefind-root]' ? mount : null;
		},
	};
}

test('bindPagefindMount gives each site-search its own Pagefind selector', (assert) => {
	const header = {id: 'starlight__search'};
	const mobile = {id: 'starlight__search'};

	assert.equal(
		bindPagefindMount(hostWith(header), 'starlight__search-1'),
		'#starlight__search-1',
	);
	assert.equal(
		bindPagefindMount(hostWith(mobile), 'starlight__search-2'),
		'#starlight__search-2',
	);
	assert.equal(header.id, 'starlight__search-1');
	assert.equal(mobile.id, 'starlight__search-2');
});

test('bindPagefindMount returns null when this instance has no mount', (assert) => {
	assert.equal(bindPagefindMount(hostWith(null), 'starlight__search-1'), null);
});
