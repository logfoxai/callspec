/**
 * Fictional "Chirp API v2" — Twitter/X-shaped demo spec for callspec UI dev server.
 */
import {predicates as p} from 'runtyp';
import {spec} from '../defineSpec';
import {route} from '../route';

const pagination = {
    maxResults: p.optional(p.number({
        description: 'Maximum number of results (1–100)',
        range: {min: 1, max: 100},
    })),
    paginationToken: p.optional(p.string({
        description: 'Opaque cursor from a previous response',
    })),
};

const userMetrics = p.object({
    followers_count: p.number(),
    following_count: p.number(),
    tweet_count: p.number(),
    listed_count: p.number(),
});

const chirpUser = p.object({
    id: p.string(),
    username: p.string(),
    name: p.string(),
    created_at: p.string(),
    description: p.string(),
    verified: p.boolean(),
    public_metrics: userMetrics,
});

const tweetMetrics = p.object({
    retweet_count: p.number(),
    reply_count: p.number(),
    like_count: p.number(),
    quote_count: p.number(),
    bookmark_count: p.number(),
    impression_count: p.number(),
});

const chirpTweet = p.object({
    id: p.string(),
    text: p.string(),
    author_id: p.string(),
    created_at: p.string(),
    lang: p.string(),
    public_metrics: tweetMetrics,
});

const pageMeta = p.object({
    result_count: p.number(),
    next_token: p.optional(p.string()),
    previous_token: p.optional(p.string()),
});

const healthOut = p.object({status: p.string()});
const userOut = p.object({data: chirpUser});
const tweetOut = p.object({data: chirpTweet});
const userPageOut = p.object({data: p.array(chirpUser), meta: pageMeta});
const tweetPageOut = p.object({data: p.array(chirpTweet), meta: pageMeta});
const deleteTweetOut = p.object({data: p.object({deleted: p.boolean(), id: p.string()})});
const listOut = p.object({
    data: p.object({
        id: p.string(),
        name: p.string(),
        description: p.string(),
        follower_count: p.number(),
        member_count: p.number(),
        private: p.boolean(),
        owner_id: p.string(),
        created_at: p.string(),
    }),
});
const dmOut = p.object({
    data: p.object({
        dm_conversation_id: p.string(),
        dm_event_id: p.string(),
        text: p.string(),
        sender_id: p.string(),
        participant_id: p.string(),
        created_at: p.string(),
    }),
});

const tweetFields = p.optional(p.array(p.string(), {
    description: 'Tweet fields to expand (e.g. author_id, created_at, public_metrics)',
}));

const userFields = p.optional(p.array(p.string(), {
    description: 'User fields to expand (e.g. created_at, public_metrics, verified)',
}));

type ChirpCtx = {userId: string; username: string};

function mockUser(id: string, username: string, name = 'Jane Doe'): {
    id: string
    username: string
    name: string
    created_at: string
    description: string
    verified: boolean
    public_metrics: {
        followers_count: number
        following_count: number
        tweet_count: number
        listed_count: number
    }
} {

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

function mockTweet(id: string, text: string, authorId: string): {
    id: string
    text: string
    author_id: string
    created_at: string
    lang: string
    public_metrics: {
        retweet_count: number
        reply_count: number
        like_count: number
        quote_count: number
        bookmark_count: number
        impression_count: number
    }
} {

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

function paginated<T>(
    items: T[],
    meta: Record<string, unknown> = {},
): {
    data: T[]
    meta: Record<string, unknown> & {result_count: number}
} {

    return {
        data: items,
        meta: {
            result_count: items.length,
            ...meta,
        },
    };

}

function authenticate(token: string, _req: unknown): ChirpCtx | undefined {

    if (token === 'demo') {

        return {userId: '2244994945', username: 'api_demo'};

    }

    return undefined;

}

const meta = {
    title: 'Chirp API v2',
    version: '2.0.0',
    intro: 'The Chirp API v2 lets you read and write posts, timelines, lists, and direct messages. This demo runs on callspec — one spec powers HTTP RPC, these docs, OpenAPI, and MCP tools.',
    website: {url: 'https://chirp.social', label: 'chirp.social'},
    logo: {light: './brand/mark.png', dark: './brand/mark.png'},
    theme: {
        accent: '#1d9bf0',
    },
    navbarLinks: [
        {label: 'chirp.social', href: 'https://chirp.social', external: true},
        {label: 'GitHub', href: 'https://github.com/logfoxai/callspec', external: true},
    ],
    authHint: 'Use Authorization: Bearer demo for private tools in this demo.',
    mcpInstructions: 'Chirp API v2 — Twitter-shaped demo. Use Bearer demo for authenticated tools.',
};

const routes = {

    healthcheck: route({
        input: p.object({}),
        output: healthOut,
        meta: {
            summary: 'Health check',
            description: 'Returns OK when the API is up. Does not require authentication.',
            tags: ['system'],
        },
        auth: 'none',
        handler: (_input, _ctx) => ({status: 'ok'}),
    }),

    getUserById: route({
        input: p.object({
            id: p.string({description: 'Unique identifier of the User (numeric string)'}),
            'user.fields': userFields,
            expansions: p.optional(p.array(p.string())),
        }),
        output: userOut,
        meta: {
            summary: 'Get User by ID',
            description: 'Returns information about a User specified by ID.',
            tags: ['users'],
        },
        auth: 'bearer',
        mcp: true,
        handler: (input: {id: string}, _ctx: ChirpCtx) => ({
            data: mockUser(input.id, 'janedoe'),
        }),
    }),

    getUserByUsername: route({
        input: p.object({
            username: p.string({description: 'Twitter handle without the @ prefix'}),
            'user.fields': userFields,
        }),
        output: userOut,
        meta: {
            summary: 'Get User by username',
            description: 'Returns information about a User specified by username.',
            tags: ['users'],
        },
        auth: 'bearer',
        mcp: true,
        handler: (input: {username: string}, _ctx: ChirpCtx) => ({
            data: mockUser('2244994945', input.username),
        }),
    }),

    getFollowers: route({
        input: p.object({
            id: p.string({description: 'User ID whose followers you want to retrieve'}),
            max_results: pagination.maxResults,
            pagination_token: pagination.paginationToken,
            'user.fields': userFields,
        }),
        output: userPageOut,
        meta: {
            summary: 'Get followers',
            description: 'Returns a list of Users who follow the specified User ID.',
            tags: ['users'],
        },
        auth: 'bearer',
        handler: (input: {pagination_token?: string | null}, _ctx: ChirpCtx) => paginated([
            mockUser('1001', 'alex_codes'),
            mockUser('1002', 'sam_reads'),
            mockUser('1003', 'taylor_ops'),
        ], {previous_token: input.pagination_token ?? null}),
    }),

    getFollowing: route({
        input: p.object({
            id: p.string({description: 'User ID whose following list you want to retrieve'}),
            max_results: pagination.maxResults,
            pagination_token: pagination.paginationToken,
            'user.fields': userFields,
        }),
        output: userPageOut,
        meta: {
            summary: 'Get following',
            description: 'Returns a list of Users the specified User ID is following.',
            tags: ['users'],
        },
        auth: 'bearer',
        handler: (input: {pagination_token?: string | null}, _ctx: ChirpCtx) => paginated([
            mockUser('2001', 'vercel'),
            mockUser('2002', 'github'),
        ], {previous_token: input.pagination_token ?? null}),
    }),

    createTweet: route({
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
        output: tweetOut,
        meta: {
            summary: 'Create Tweet',
            description: 'Creates a Tweet on behalf of an authenticated user.',
            tags: ['tweets'],
        },
        auth: 'bearer',
        mcp: true,
        handler: (input: {text: string}, ctx: ChirpCtx) => ({
            data: mockTweet('1992312312312312321', input.text, ctx.userId),
        }),
    }),

    deleteTweet: route({
        input: p.object({
            id: p.string({description: 'Tweet ID to delete'}),
        }),
        output: deleteTweetOut,
        meta: {
            summary: 'Delete Tweet',
            description: 'Allows an authenticated user ID to delete a Tweet.',
            tags: ['tweets'],
        },
        auth: 'bearer',
        handler: (input: {id: string}, _ctx: ChirpCtx) => ({
            data: {deleted: true, id: input.id},
        }),
    }),

    getTweet: route({
        input: p.object({
            id: p.string({description: 'Unique identifier of the Tweet'}),
            'tweet.fields': tweetFields,
            expansions: p.optional(p.array(p.string())),
        }),
        output: tweetOut,
        meta: {
            summary: 'Get Tweet by ID',
            description: 'Returns a Tweet specified by the requested ID.',
            tags: ['tweets'],
        },
        auth: 'none',
        handler: (input: {id: string}, _ctx: ChirpCtx) => ({
            data: mockTweet(input.id, 'Just shipped a new API docs UI with callspec 🎉', '2244994945'),
        }),
    }),

    searchRecent: route({
        input: p.object({
            query: p.string({description: 'Search query (supports operators like from:, #hashtag, -filter:retweets)'}),
            max_results: pagination.maxResults,
            start_time: p.optional(p.string({description: 'ISO 8601 start time (inclusive)'})),
            end_time: p.optional(p.string({description: 'ISO 8601 end time (exclusive)'})),
            'tweet.fields': tweetFields,
        }),
        output: tweetPageOut,
        meta: {
            summary: 'Search recent Tweets',
            description: 'Returns Tweets from the last seven days matching a search query.',
            tags: ['tweets'],
        },
        auth: 'bearer',
        mcp: true,
        handler: (input: {query: string}, _ctx: ChirpCtx) => paginated([
            mockTweet('3001', `Results for: ${input.query}`, '2244994945'),
            mockTweet('3002', 'Another match from the last 7 days', '1001'),
        ]),
    }),

    getHomeTimeline: route({
        input: p.object({
            max_results: pagination.maxResults,
            pagination_token: pagination.paginationToken,
            exclude: p.optional(p.array(p.string(), {
                description: 'Exclude retweets, replies, or both (e.g. retweets,replies)',
            })),
            'tweet.fields': tweetFields,
        }),
        output: tweetPageOut,
        meta: {
            summary: 'Home timeline',
            description: 'Returns the most recent Tweets from accounts the authenticated user follows.',
            tags: ['timelines'],
        },
        auth: 'bearer',
        handler: (_input, ctx: ChirpCtx) => paginated([
            mockTweet('4001', 'Morning standup notes thread 🧵', ctx.userId),
            mockTweet('4002', 'TIL: JSON Schema from runtyp predicates', '2001'),
            mockTweet('4003', 'Shipping docs today', '2002'),
        ]),
    }),

    getUserTimeline: route({
        input: p.object({
            id: p.string({description: 'User ID whose Tweets you want to retrieve'}),
            max_results: pagination.maxResults,
            pagination_token: pagination.paginationToken,
            exclude: p.optional(p.array(p.string())),
            'tweet.fields': tweetFields,
        }),
        output: tweetPageOut,
        meta: {
            summary: 'User Tweet timeline',
            description: 'Returns the most recent Tweets authored by the specified User.',
            tags: ['timelines'],
        },
        auth: 'bearer',
        handler: (input: {id: string}, _ctx: ChirpCtx) => paginated([
            mockTweet('5001', 'Working on RPC + OpenAPI from one spec', input.id),
            mockTweet('5002', 'callspec UI looking clean', input.id),
        ]),
    }),

    createList: route({
        input: p.object({
            name: p.string({description: 'Name of the List (25 char max recommended)'}),
            description: p.optional(p.string({description: 'Description of the List'})),
            private: p.optional(p.boolean({description: 'If true, only the creator can see the List'})),
        }),
        output: listOut,
        meta: {
            summary: 'Create List',
            description: 'Creates a new List for the authenticated user.',
            tags: ['lists'],
        },
        auth: 'bearer',
        handler: (input: {name: string; description?: string; private?: boolean}, ctx: ChirpCtx) => ({
            data: {
                id: '1313131313131311313',
                name: input.name,
                description: input.description ?? '',
                follower_count: 0,
                member_count: 0,
                private: input.private ?? false,
                owner_id: ctx.userId,
                created_at: '2026-07-28T15:00:00.000Z',
            },
        }),
    }),

    getListMembers: route({
        input: p.object({
            id: p.string({description: 'List ID'}),
            max_results: pagination.maxResults,
            pagination_token: pagination.paginationToken,
            'user.fields': userFields,
        }),
        output: userPageOut,
        meta: {
            summary: 'Get List members',
            description: 'Returns a list of Users who are members of the specified List.',
            tags: ['lists'],
        },
        auth: 'bearer',
        handler: (_input, _ctx) => paginated([
            mockUser('6001', 'designbot'),
            mockUser('6002', 'infra_daily'),
        ]),
    }),

    sendDirectMessage: route({
        input: p.object({
            participant_id: p.string({description: 'User ID of the conversation participant'}),
            text: p.string({description: 'Message body (max 10,000 characters)'}),
        }),
        output: dmOut,
        meta: {
            summary: 'Send a DM',
            description: 'Sends a Direct Message to a participant on behalf of the authenticated user.',
            tags: ['direct messages'],
        },
        auth: 'bearer',
        handler: (input: {text: string; participant_id: string}, ctx: ChirpCtx) => ({
            data: {
                dm_conversation_id: '12345-67890',
                dm_event_id: '9876543210',
                text: input.text,
                sender_id: ctx.userId,
                participant_id: input.participant_id,
                created_at: '2026-07-28T15:00:00.000Z',
            },
        }),
    }),

};

export const api = spec({
    meta,
    routes,
    authenticate,
});
