import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

// Local typed wrapper — supabase.auth.oauth is beta and not in the shipped types.
const oauth = (supabase.auth as unknown as {
  oauth: {
    getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
    approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
    denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  };
}).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError("Missing authorization_id");
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      return setError(error.message);
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      return setError("No redirect returned by the authorization server.");
    }
    window.location.href = target;
  }

  if (error)
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
        <div className="max-w-md text-center space-y-2">
          <h1 className="text-xl font-semibold">Authorization error</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </main>
    );
  if (!details)
    return (
      <main className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-sm text-muted-foreground">Loading authorization…</p>
      </main>
    );

  const clientName = details.client?.name ?? "an application";

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 space-y-6 shadow-xl">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Connect {clientName} to SIGMA</h1>
          <p className="text-sm text-muted-foreground">
            {clientName} is requesting access to act on SIGMA as you. It will be able to use the tools
            exposed by this app on your behalf.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button disabled={busy} onClick={() => decide(true)} className="w-full">
            Approve
          </Button>
          <Button disabled={busy} onClick={() => decide(false)} variant="outline" className="w-full">
            Deny
          </Button>
        </div>
      </div>
    </main>
  );
}
