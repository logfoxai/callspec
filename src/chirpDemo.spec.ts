import {test} from 'kizu';
import {emitOpenApi} from './openapi';
import {callspecDocumentToUiSpec} from './callspec-ui/toUiSpec';
import {emitCallspec} from './emitCallspec';
import {parseCallspecDocument} from './callspecDocument';
import {api} from './demo/chirpDemoApi';

type OpenApiPath = Record<string, {
    post?: {
        requestBody?: {
            content?: {
                'application/json'?: {
                    schema?: Record<string, unknown>
                }
            }
        }
    }
}>;

test('chirp demo: emitOpenApi converts runtyp preds to JSON Schema', (assert) => {

    const doc = emitCallspec(api.routes, {
        title: 'Chirp API v2',
        version: '2.0.0',
        basePath: '/v1',
    });

    const spec = callspecDocumentToUiSpec(parseCallspecDocument(doc));

    assert.equal(spec.routes.length, 14, 'route count');

    const searchRecent = spec.routes.find((route) => route.name === 'searchRecent');

    assert.equal(searchRecent?.auth, 'bearer', 'searchRecent auth');
    assert.equal(searchRecent?.mcp, true, 'searchRecent mcp');

    const paths = emitOpenApi(api.routes, {
        title: 'Chirp API v2',
        version: '2.0.0',
        basePath: '/v1',
    }).paths as OpenApiPath;
    const searchSchema = paths['/v1/searchRecent']?.post?.requestBody?.content?.['application/json']?.schema as {
        properties?: Record<string, {description?: string; minimum?: number; maximum?: number}>
    } | undefined;

    assert.equal(
        searchSchema?.properties?.query?.description?.includes('Search query'),
        true,
        'query description from runtyp',
    );
    assert.equal(searchSchema?.properties?.max_results?.minimum, 1, 'max_results minimum');
    assert.equal(searchSchema?.properties?.max_results?.maximum, 100, 'max_results maximum');

    const createTweetSchema = paths['/v1/createTweet']?.post?.requestBody?.content?.['application/json']?.schema as {
        properties?: {
            poll?: {
                properties?: {
                    duration_minutes?: {minimum?: number; maximum?: number}
                }
            }
        }
    } | undefined;

    assert.equal(createTweetSchema?.properties?.poll?.properties?.duration_minutes?.minimum, 5, 'poll duration min');
    assert.equal(createTweetSchema?.properties?.poll?.properties?.duration_minutes?.maximum, 10080, 'poll duration max');

});
