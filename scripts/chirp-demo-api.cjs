/**
 * Fictional "Chirp API v2" — Twitter/X-shaped demo spec for callspec UI dev server.
 */
const {predicates: p} = require('runtyp');
const {defineSpec, defineRoute} = require('../dist');

const tweetFields = p.optional(p.array(p.string(), {
    description: 'Tweet fields to expand (e.g. author_id, created_at, public_metrics)',
}));

const userFields = p.optional(p.array(p.string(), {
    description: 'User fields to expand (e.g. created_at, public_metrics, verified)',
}));

const pagination = {
    maxResults: p.optional(p.number({
        description: 'Maximum number of results (1–100)',
        range: {min: 1, max: 100},
    })),
    paginationToken: p.optional(p.string({
        description: 'Opaque cursor from a previous response',
    })),
};

function mockUser(id, username, name = 'Jane Doe') {

    return {
        id,
        username,
        name,
        created_at: '2024-01-15T12:00:00.000Z',
        description: 'Building things on the internet.',
        verified: false,
        public_metrics: {
            followers_count: 1204,
            following_count: 312,
            tweet_count: 89,
            listed_count: 4,
        },
    };

}

function mockTweet(id, text, authorId) {

    return {
        id,
        text,
        author_id: authorId,
        created_at: '2026-07-28T15:00:00.000Z',
        lang: 'en',
        public_metrics: {
            retweet_count: 12,
            reply_count: 3,
            like_count: 47,
            quote_count: 1,
            bookmark_count: 5,
            impression_count: 892,
        },
    };

}

function paginated(dataKey, items, meta = {}) {

    return {
        data: items,
        meta: {
            result_count: items.length,
            next_token: null,
            ...meta,
        },
        [dataKey]: items,
    };

}

const api = defineSpec({

    healthcheck: defineRoute({
        input: p.object({}),
        meta: {
            summary: 'Health check',
            description: 'Returns OK when the API is up. Does not require authentication.',
            tags: ['system'],
        },
        access: 'public',
        handler: (_input, _ctx) => ({status: 'ok'}),
    }),

    getUserById: defineRoute({
        input: p.object({
            id: p.string({description: 'Unique identifier of the User (numeric string)'}),
            'user.fields': userFields,
            expansions: p.optional(p.array(p.string())),
        }),
        meta: {
            summary: 'Get User by ID',
            description: 'Returns information about a User specified by ID.',
            tags: ['users'],
        },
        access: 'private',
        mcp: true,
        handler: (input, _ctx) => ({
            data: mockUser(input.id, 'janedoe'),
        }),
    }),

    getUserByUsername: defineRoute({
        input: p.object({
            username: p.string({description: 'Twitter handle without the @ prefix'}),
            'user.fields': userFields,
        }),
        meta: {
            summary: 'Get User by username',
            description: 'Returns information about a User specified by username.',
            tags: ['users'],
        },
        access: 'private',
        mcp: true,
        handler: (input, _ctx) => ({
            data: mockUser('2244994945', input.username),
        }),
    }),

    getFollowers: defineRoute({
        input: p.object({
            id: p.string({description: 'User ID whose followers you want to retrieve'}),
            max_results: pagination.maxResults,
            pagination_token: pagination.paginationToken,
            'user.fields': userFields,
        }),
        meta: {
            summary: 'Get followers',
            description: 'Returns a list of Users who follow the specified User ID.',
            tags: ['users'],
        },
        access: 'private',
        handler: (input, _ctx) => paginated('data', [
            mockUser('1001', 'alex_codes'),
            mockUser('1002', 'sam_reads'),
            mockUser('1003', 'taylor_ops'),
        ], {previous_token: input.pagination_token ?? null}),
    }),

    getFollowing: defineRoute({
        input: p.object({
            id: p.string({description: 'User ID whose following list you want to retrieve'}),
            max_results: pagination.maxResults,
            pagination_token: pagination.paginationToken,
            'user.fields': userFields,
        }),
        meta: {
            summary: 'Get following',
            description: 'Returns a list of Users the specified User ID is following.',
            tags: ['users'],
        },
        access: 'private',
        handler: (input, _ctx) => paginated('data', [
            mockUser('2001', 'vercel'),
            mockUser('2002', 'github'),
        ], {previous_token: input.pagination_token ?? null}),
    }),

    createTweet: defineRoute({
        input: p.object({
            text: p.string({description: 'Body of the Tweet (max 280 characters)'}),
            reply: p.optional(p.object({
                in_reply_to_tweet_id: p.string({description: 'Tweet ID this is replying to'}),
            })),
            media: p.optional(p.object({
                media_ids: p.array(p.string(), {len: {min: 1, max: 4}}),
            })),
            poll: p.optional(p.object({
                options: p.array(p.string(), {len: {min: 2, max: 4}}),
                duration_minutes: p.number({range: {min: 5, max: 10080}}),
            })),
        }),
        meta: {
            summary: 'Create Tweet',
            description: 'Creates a Tweet on behalf of an authenticated user.',
            tags: ['tweets'],
        },
        access: 'private',
        mcp: true,
        handler: (input, ctx) => ({
            data: mockTweet('1992312312312312321', input.text, ctx?.userId ?? '2244994945'),
        }),
    }),

    deleteTweet: defineRoute({
        input: p.object({
            id: p.string({description: 'Tweet ID to delete'}),
        }),
        meta: {
            summary: 'Delete Tweet',
            description: 'Allows an authenticated user ID to delete a Tweet.',
            tags: ['tweets'],
        },
        access: 'private',
        handler: (input, _ctx) => ({
            data: {deleted: true, id: input.id},
        }),
    }),

    getTweet: defineRoute({
        input: p.object({
            id: p.string({description: 'Unique identifier of the Tweet'}),
            'tweet.fields': tweetFields,
            expansions: p.optional(p.array(p.string())),
        }),
        meta: {
            summary: 'Get Tweet by ID',
            description: 'Returns a Tweet specified by the requested ID.',
            tags: ['tweets'],
        },
        access: 'public',
        handler: (input, _ctx) => ({
            data: mockTweet(input.id, 'Just shipped a new API docs UI with callspec 🎉', '2244994945'),
        }),
    }),

    searchRecent: defineRoute({
        input: p.object({
            query: p.string({description: 'Search query (supports operators like from:, #hashtag, -filter:retweets)'}),
            max_results: pagination.maxResults,
            start_time: p.optional(p.string({description: 'ISO 8601 start time (inclusive)'})),
            end_time: p.optional(p.string({description: 'ISO 8601 end time (exclusive)'})),
            'tweet.fields': tweetFields,
        }),
        meta: {
            summary: 'Search recent Tweets',
            description: 'Returns Tweets from the last seven days matching a search query.',
            tags: ['tweets'],
        },
        access: 'private',
        mcp: true,
        handler: (input, _ctx) => paginated('data', [
            mockTweet('3001', `Results for: ${input.query}`, '2244994945'),
            mockTweet('3002', 'Another match from the last 7 days', '1001'),
        ]),
    }),

    getHomeTimeline: defineRoute({
        input: p.object({
            max_results: pagination.maxResults,
            pagination_token: pagination.paginationToken,
            exclude: p.optional(p.array(p.string(), {
                description: 'Exclude retweets, replies, or both (e.g. retweets,replies)',
            })),
            'tweet.fields': tweetFields,
        }),
        meta: {
            summary: 'Home timeline',
            description: 'Returns the most recent Tweets from accounts the authenticated user follows.',
            tags: ['timelines'],
        },
        access: 'private',
        handler: (_input, ctx) => paginated('data', [
            mockTweet('4001', 'Morning standup notes thread 🧵', ctx?.userId ?? '2244994945'),
            mockTweet('4002', 'TIL: JSON Schema from runtyp predicates', '2001'),
            mockTweet('4003', 'Shipping docs today', '2002'),
        ]),
    }),

    getUserTimeline: defineRoute({
        input: p.object({
            id: p.string({description: 'User ID whose Tweets you want to retrieve'}),
            max_results: pagination.maxResults,
            pagination_token: pagination.paginationToken,
            exclude: p.optional(p.array(p.string())),
            'tweet.fields': tweetFields,
        }),
        meta: {
            summary: 'User Tweet timeline',
            description: 'Returns the most recent Tweets authored by the specified User.',
            tags: ['timelines'],
        },
        access: 'private',
        handler: (input, _ctx) => paginated('data', [
            mockTweet('5001', 'Working on RPC + OpenAPI from one spec', input.id),
            mockTweet('5002', 'callspec UI looking clean', input.id),
        ]),
    }),

    createList: defineRoute({
        input: p.object({
            name: p.string({description: 'Name of the List (25 char max recommended)'}),
            description: p.optional(p.string({description: 'Description of the List'})),
            private: p.optional(p.boolean({description: 'If true, only the creator can see the List'})),
        }),
        meta: {
            summary: 'Create List',
            description: 'Creates a new List for the authenticated user.',
            tags: ['lists'],
        },
        access: 'private',
        handler: (input, ctx) => ({
            data: {
                id: '1313131313131311313',
                name: input.name,
                description: input.description ?? '',
                follower_count: 0,
                member_count: 0,
                private: input.private ?? false,
                owner_id: ctx?.userId ?? '2244994945',
                created_at: '2026-07-28T15:00:00.000Z',
            },
        }),
    }),

    getListMembers: defineRoute({
        input: p.object({
            id: p.string({description: 'List ID'}),
            max_results: pagination.maxResults,
            pagination_token: pagination.paginationToken,
            'user.fields': userFields,
        }),
        meta: {
            summary: 'Get List members',
            description: 'Returns a list of Users who are members of the specified List.',
            tags: ['lists'],
        },
        access: 'private',
        handler: (_input, _ctx) => paginated('data', [
            mockUser('6001', 'designbot'),
            mockUser('6002', 'infra_daily'),
        ]),
    }),

    sendDirectMessage: defineRoute({
        input: p.object({
            participant_id: p.string({description: 'User ID of the conversation participant'}),
            text: p.string({description: 'Message body (max 10,000 characters)'}),
        }),
        meta: {
            summary: 'Send a DM',
            description: 'Sends a Direct Message to a participant on behalf of the authenticated user.',
            tags: ['direct messages'],
        },
        access: 'private',
        handler: (input, ctx) => ({
            data: {
                dm_conversation_id: '12345-67890',
                dm_event_id: '9876543210',
                text: input.text,
                sender_id: ctx?.userId ?? '2244994945',
                participant_id: input.participant_id,
                created_at: '2026-07-28T15:00:00.000Z',
            },
        }),
    }),

});

module.exports = {api};
