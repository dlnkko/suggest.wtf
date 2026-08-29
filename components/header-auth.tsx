"use client";

import { Button } from "@/components/button";
import { startGoogleOAuth } from "@/lib/supabase/oauth";
import { useState } from "react";

export function HeaderLogIn() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logIn() {
    setPending(true);
    setError(null);
    const path = `${window.location.pathname}${window.location.search}`;
    const next = !path || path.startsWith("/auth") ? "/" : path;
    const message = await startGoogleOAuth(next);
    if (message) {
      setError(message);
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end">
      {error ? (
        <p className="mb-2 max-w-xs text-right text-xs text-[#9a3412]">{error}</p>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        className="px-4 py-2.5 text-[15px]"
        disabled={pending}
        onClick={() => void logIn()}
      >
        Log in
      </Button>
    </div>
  );
}
