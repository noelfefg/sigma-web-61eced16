/**
 * Apollo client → talks to the SIGMA Go server's /graphql endpoint.
 *
 * Opt-in: when VITE_GO_API_URL is unset, this module is harmless and
 * any hook that depends on it should bail out gracefully.
 */
import { ApolloClient, InMemoryCache, HttpLink, from, type DefaultOptions } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { supabase } from "@/integrations/supabase/client";

const GO_API_URL = import.meta.env.VITE_GO_API_URL as string | undefined;

export const goApiEnabled = Boolean(GO_API_URL);

const httpLink = new HttpLink({
  uri: GO_API_URL ? `${GO_API_URL.replace(/\/$/, "")}/graphql` : "/graphql",
});

const authLink = setContext(async (_, { headers }) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) graphQLErrors.forEach((e) => console.warn("[gql]", e.message));
  if (networkError) console.warn("[gql network]", networkError.message);
});

const defaultOptions: DefaultOptions = {
  watchQuery: { fetchPolicy: "cache-and-network", errorPolicy: "all" },
  query: { fetchPolicy: "network-only", errorPolicy: "all" },
};

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions,
  connectToDevTools: import.meta.env.DEV,
});
