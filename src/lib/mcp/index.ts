import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listMyPosts from "./tools/list-my-posts";
import createPost from "./tools/create-post";
import getMyProfile from "./tools/get-my-profile";
import listCommunities from "./tools/list-communities";
import searchUsers from "./tools/search-users";

// OAuth issuer MUST be the direct Supabase host built from the project ref.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "sigma-mcp",
  title: "SIGMA",
  version: "0.1.0",
  instructions:
    "Tools for the SIGMA social streaming platform. Use `get_my_profile` to identify the signed-in user, `list_my_posts` and `create_post` to manage their feed, `list_communities` to browse groups, and `search_users` to find other creators.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getMyProfile, listMyPosts, createPost, listCommunities, searchUsers],
});
