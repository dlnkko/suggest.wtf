"use client";

import { Button } from "@/components/button";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export function HeaderLogIn() {
  const [pending, setPending] = useState(false);

  async function logIn() {
    setPending(true);
    const supabase = createClient();
    const origin = window.location.origin;
    const path = `${window.location.pathname}${window.location.search}`;
    const next = !path || path.startsWith("/auth") ? "/" : path;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) setPending(false);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className="px-4 py-2.5 text-[15px]"
      disabled={pending}
      onClick={() => void logIn()}
    >
      Log in
    </Button>
  );
}
