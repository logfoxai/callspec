import {test} from 'kizu';
import {explorerSearchScope} from './explorerSearch';

test('explorerSearchScope: typing filters the sidebar only on home and route pages', (assert) => {

    assert.equal(explorerSearchScope({kind: 'home'}), {
        sidebar: true,
        routesOverview: false,
    });
    assert.equal(explorerSearchScope({kind: 'route', name: 'searchPosts'}), {
        sidebar: true,
        routesOverview: false,
    });

});

test('explorerSearchScope: on the routes list, search also refreshes that page', (assert) => {

    assert.equal(explorerSearchScope({kind: 'routes'}), {
        sidebar: true,
        routesOverview: true,
    });

});
