// GraphQL gateway over Postgres for SIGMA.
// POST /graphql  { query, variables? }
// Read-only schema covering profiles, posts, streams, notifications.
import { corsHeaders } from '@supabase/supabase-js/cors';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { graphql, buildSchema } from 'https://esm.sh/graphql@16.9.0';

const schema = buildSchema(/* GraphQL */ `
  type Profile {
    id: ID!
    username: String!
    display_name: String!
    avatar_url: String
    banner_url: String
    bio: String
    follower_count: Int!
    following_count: Int!
  }

  type Post {
    id: ID!
    user_id: ID!
    title: String
    content: String
    post_type: String!
    media_urls: [String!]!
    view_count: Int!
    created_at: String!
    author: Profile
  }

  type Stream {
    id: ID!
    user_id: ID!
    title: String!
    description: String
    is_live: Boolean!
    viewer_count: Int!
    thumbnail_url: String
    created_at: String!
    author: Profile
  }

  type Notification {
    id: ID!
    type: String!
    title: String!
    body: String
    image_url: String
    link: String
    is_read: Boolean!
    created_at: String!
  }

  type Query {
    profile(username: String!): Profile
    posts(limit: Int = 20, offset: Int = 0): [Post!]!
    liveStreams(limit: Int = 20): [Stream!]!
    notifications(user_id: ID!, limit: Int = 20): [Notification!]!
  }
`);

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const root = {
  profile: async ({ username }: { username: string }) => {
    const { data: p } = await supabase.from('profiles').select('*').eq('username', username).single();
    if (!p) return null;
    const [{ count: fc }, { count: gc }] = await Promise.all([
      supabase.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', p.id),
      supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', p.id),
    ]);
    return { ...p, follower_count: fc ?? 0, following_count: gc ?? 0 };
  },
  posts: async ({ limit, offset }: { limit: number; offset: number }) => {
    const { data } = await supabase.from('posts').select('*, profiles(*)')
      .order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    return (data ?? []).map((p: any) => ({ ...p, author: p.profiles }));
  },
  liveStreams: async ({ limit }: { limit: number }) => {
    const { data } = await supabase.from('streams').select('*, profiles(*)')
      .eq('is_live', true).order('viewer_count', { ascending: false }).limit(limit);
    return (data ?? []).map((s: any) => ({ ...s, author: s.profiles }));
  },
  notifications: async ({ user_id, limit }: { user_id: string; limit: number }) => {
    const { data } = await supabase.from('notifications').select('*')
      .eq('user_id', user_id).order('created_at', { ascending: false }).limit(limit);
    return data ?? [];
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method === 'GET') {
    return new Response(
      `<!DOCTYPE html><html><body style="font-family:monospace;padding:24px;background:#0b0d10;color:#e8eaed">
        <h1>SIGMA GraphQL</h1>
        <p>POST queries to this endpoint as <code>{ "query": "...", "variables": {} }</code></p>
        <p>Try: <code>{ posts(limit:5) { id title author { username } } }</code></p>
      </body></html>`,
      { headers: { ...corsHeaders, 'Content-Type': 'text/html' } },
    );
  }
  try {
    const { query, variables } = await req.json();
    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ errors: [{ message: 'Missing query' }] }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const result = await graphql({ schema, source: query, rootValue: root, variableValues: variables });
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('graphql error', err);
    return new Response(JSON.stringify({ errors: [{ message: String((err as Error).message) }] }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
