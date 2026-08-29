"use client";

import { Button } from "@/components/button";
import { startGoogleOAuth } from "@/lib/supabase/oauth";
import { useEffect, useRef, useState } from "react";

const ERRORS: Record<string, string> = {
  auth: "Google sign-in didn’t finish. Try again.",
};

export function GoogleSignIn({
  errorCode,
  next = "/list",
  autoStart = false,
}: {
  errorCode?: string;
  next?: string;
  autoStart?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const started = useRef(false);
  const error = localError ?? (errorCode ? ERRORS[errorCode] : null);

  useEffect(() => {
    if (!autoStart || errorCode || started.current) return;
    started.current = true;
    void continueWithGoogle();
  }, [autoStart, errorCode]);

  async function continueWithGoogle() {
    setPending(true);
    setLocalError(null);
    const message = await startGoogleOAuth(next);
    if (message) {
      setLocalError(message);
      setPending(false);
    }
  }

  return (
    <div className="rise mt-10 max-w-sm">
      {error ? <p className="mb-4 text-sm text-[#9a3412]">{error}</p> : null}
      <Button
        type="button"
        variant="google"
        className="w-full px-5 py-3.5 text-[15px]"
        disabled={pending}
        onClick={() => void continueWithGoogle()}
      >
        <span className="flex items-center justify-center gap-3">
          <GoogleMark />
          Continue with Google
        </span>
      </Button>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
