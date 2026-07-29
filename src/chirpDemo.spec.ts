import {createRequire} from 'node:module';
import path from 'node:path';
import {test} from 'kizu';
import {emitOpenApi} from './openapi';
import {parseCallspecOpenApi} from './callspec-ui/parseOpenApi';

const requireCjs = createRequire(path.join(process.cwd(), 'package.json'));

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

    const {api} = requireCjs(path.join(process.cwd(), 'scripts/chirp-demo-api.cjs')) as {
        api: Parameters<typeof emitOpenApi>[0]
    };

    const doc = emitOpenApi(api, {
        title: 'Chirp API v2',
        version: '2.0.0',
        basePath: '/v1',
    });

    const spec = parseCallspecOpenApi(doc);

    assert.equal(spec.routes.length, 14, 'route count');

    const searchRecent = spec.routes.find((route) => route.name === 'searchRecent');

    assert.equal(searchRecent?.access, 'private', 'searchRecent access');
    assert.equal(searchRecent?.mcp, true, 'searchRecent mcp');

    const paths = doc.paths as OpenApiPath;
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
