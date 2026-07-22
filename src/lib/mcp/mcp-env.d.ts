// Ambient types for MCP tool files that run inside Deno (Supabase Edge Functions).
// The tools are bundled by @lovable.dev/mcp-js; at runtime `process.env` is
// polyfilled by the emitted function. This declaration keeps TS happy in the
// browser tsconfig without pulling in @types/node.
declare const process: { env: Record<string, string | undefined> };
