import { createClient } from "@/lib/supabase/client";
import { isLocalHost, oauthAppOrigin } from "@/lib/site";

export async function startGoogleOAuth(next: string): Promise<string | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return "Sign-in isn’t configured. Add the Supabase public keys in Vercel and redeploy.";
  }

  try {
    const supabase = createClient();
    const redirectTo = `${oauthAppOrigin()}/auth/callback?next=${encodeURIComponent(next)}`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      return error?.message ?? "Google sign-in didn’t start.";
    }

    window.location.assign(rewriteLocalRedirect(data.url, redirectTo));
    return null;
  } catch (error) {
    return error instanceof Error
      ? error.message
      : "Google sign-in didn’t start.";
  }
}

function rewriteLocalRedirect(authorizeUrl: string, redirectTo: string): string {
  try {
    const parsed = new URL(authorizeUrl);
    const current = parsed.searchParams.get("redirect_to") ?? "";
    if (current && isLocalHost(current) && !isLocalHost(redirectTo)) {
      parsed.searchParams.set("redirect_to", redirectTo);
    }
    return parsed.toString();
  } catch {
    return authorizeUrl;
  }
}
