"use client";

import { Button } from "@/components/button";
import { normalizeUrl } from "@/lib/url";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UrlSuggest({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = normalizeUrl(value);
    if (!url) return;
    const encoded = encodeURIComponent(url);
    router.push(signedIn ? `/suggest?url=${encoded}` : `/continue?url=${encoded}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center">
      <form onSubmit={onSubmit} className="w-full">
        <label htmlFor="url" className="sr-only">
          Your site URL
        </label>
        <div className="search-shell flex items-center gap-2 rounded-[1.35rem] p-1.5">
          <input
            id="url"
            name="url"
            type="text"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            required
            placeholder="https://your-startup.com"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="min-w-0 flex-1 bg-transparent px-4 py-3 font-mono text-[15px] tracking-tight text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
          />
          <Button type="submit" className="shrink-0 rounded-[1.05rem] px-5 py-3 text-sm">
            Suggest
          </Button>
        </div>
      </form>
    </div>
  );
}
