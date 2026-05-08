// MongoDB bridge — proxies CRUD to a MongoDB Atlas Data API.
// Requires secrets: MONGODB_DATA_API_URL, MONGODB_DATA_API_KEY, MONGODB_DATABASE, MONGODB_DATA_SOURCE
// POST body: { action: 'find'|'findOne'|'insertOne'|'updateOne'|'deleteOne', collection, filter?, document?, update?, limit? }
import { corsHeaders } from '@supabase/supabase-js/cors';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const url = Deno.env.get('MONGODB_DATA_API_URL');
    const key = Deno.env.get('MONGODB_DATA_API_KEY');
    const db = Deno.env.get('MONGODB_DATABASE');
    const ds = Deno.env.get('MONGODB_DATA_SOURCE');
    if (!url || !key || !db || !ds) {
      return new Response(JSON.stringify({
        error: 'mongo_not_configured',
        message: 'Add MONGODB_DATA_API_URL, MONGODB_DATA_API_KEY, MONGODB_DATABASE, MONGODB_DATA_SOURCE secrets.',
      }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Authenticate caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = await req.json();
    const allowed = new Set(['find', 'findOne', 'insertOne', 'updateOne', 'deleteOne']);
    if (!allowed.has(body.action)) {
      return new Response(JSON.stringify({ error: 'invalid_action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const res = await fetch(`${url.replace(/\/$/, '')}/action/${body.action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apiKey': key },
      body: JSON.stringify({
        dataSource: ds,
        database: db,
        collection: body.collection,
        ...(body.filter && { filter: body.filter }),
        ...(body.document && { document: { ...body.document, _user_id: userData.user.id } }),
        ...(body.update && { update: body.update }),
        ...(body.limit && { limit: body.limit }),
      }),
    });
    const text = await res.text();
    return new Response(text, { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('mongo-bridge error', err);
    return new Response(JSON.stringify({ error: String((err as Error).message) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
