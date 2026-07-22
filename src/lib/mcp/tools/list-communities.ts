import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_communities",
  title: "List communities",
  description: "Browse SIGMA communities ordered by member count.",
  inputSchema: {
    query: z.string().optional().describe("Filter by name (case-insensitive substring)."),
    limit: z.number().int().min(1).max(50).optional().describe("Max results (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    let q = supabaseForUser(ctx)
      .from("communities")
      .select("id, name, slug, description, member_count, created_at")
      .order("member_count", { ascending: false })
      .limit(limit ?? 20);

    if (query) q = q.ilike("name", `%${query}%`);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { communities: data ?? [] },
    };
  },
});
