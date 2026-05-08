// AI feed ranking — uses Lovable AI Gateway (no API key required).
// POST { user_id?: string, items: [{id, type, content, view_count, created_at, user_id}] }
// Returns { ranked: [{id, score, reason}] }
import { corsHeaders } from '@supabase/supabase-js/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { items = [], user_id } = await req.json().catch(() => ({}));
    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ ranked: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not set');

    // Compact items for prompt
    const compact = items.slice(0, 50).map((it: any) => ({
      id: it.id,
      type: it.type,
      preview: (it.content || it.title || '').slice(0, 140),
      views: it.view_count ?? 0,
      age_min: Math.max(0, (Date.now() - new Date(it.created_at).getTime()) / 60000) | 0,
    }));

    const sys = `You rank social feed items for engagement and freshness.
Score 0-100. Boost: live streams, recent posts (<60 min), high views, varied content types.
Return ONLY JSON: { "ranked": [{"id":"...","score":N,"reason":"..."}] }. No prose.`;

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: `User: ${user_id ?? 'anon'}\nItems:\n${JSON.stringify(compact)}` },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (res.status === 429) return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (res.status === 402) return new Response(JSON.stringify({ error: 'payment_required' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (!res.ok) throw new Error(`AI gateway ${res.status}: ${await res.text()}`);

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? '{"ranked":[]}';
    let parsed: any = { ranked: [] };
    try { parsed = JSON.parse(content); } catch { /* fallback */ }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('rank-feed error', err);
    return new Response(JSON.stringify({ error: String((err as Error).message) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
