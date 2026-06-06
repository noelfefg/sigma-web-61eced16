/**
 * Apollo client → talks to the SIGMA Go server's /graphql endpoint.
 * Opt-in: when VITE_GO_API_URL is unset, the client points at a stub URL
 * and any hook that depends on it should bail out via `goApiEnabled`.
 */
import { ApolloClient, InMemoryCache, HttpLink, from } from "@apollo/client";
import { SetContextLink } from "@apollo/client/link/context";
import { ErrorLink } from "@apollo/client/link/error";
import { supabase } from "@/integrations/supabase/client";

const GO_API_URL = import.meta.env.VITE_GO_API_URL as string | undefined;

export const goApiEnabled = Boolean(GO_API_URL);

const httpLink = new HttpLink({
  uri: GO_API_URL ? `${GO_API_URL.replace(/\/$/, "")}/graphql` : "/graphql",
});

const authLink = new SetContextLink(async (prev) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers: Record<string, string> = { ...(prev.headers as Record<string, string> | undefined) };
  if (token) headers.Authorization = `Bearer ${token}`;
  return { headers };
});

const errorLink = new ErrorLink(({ error }) => {
  console.warn("[gql]", error?.message ?? error);
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});
