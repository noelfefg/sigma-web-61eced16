/// <reference path="../mcp-env.d.ts" />
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
  name: "create_post",
  title: "Create post",
  description: "Publish a new text post on SIGMA as the signed-in user.",
  inputSchema: {
    content: z.string().trim().min(1).describe("Post body text."),
    media_url: z.string().url().optional().describe("Optional image or video URL."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ content, media_url }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };

    const { data, error } = await supabaseForUser(ctx)
      .from("posts")
      .insert({ user_id: ctx.getUserId(), content, media_url: media_url ?? null })
      .select()
      .single();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Posted: ${data.id}` }],
      structuredContent: { post: data },
    };
  },
});
