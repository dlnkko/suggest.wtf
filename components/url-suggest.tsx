"use client";

import { Button } from "@/components/button";
import { KIND_LABELS } from "@/lib/constants";
import type { SuggestResponse } from "@/lib/types";
import { displayHost } from "@/lib/url";
import { useState } from "react";

const STEPS = [
  "Reading your site",
  "What would help next",
  "Matching the catalog",
];

export function UrlSuggest() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SuggestResponse | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    setStep(0);

    const timers = [
      window.setTimeout(() => setStep(1), 1200),
      window.setTimeout(() => setStep(2), 2800),
    ];

    try {
      const response = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
      const payload = (await response.json()) as SuggestResponse & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "We couldn’t analyze that URL.");
      }
      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      timers.forEach(clearTimeout);
      setLoading(false);
    }
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
          <Button
            type="submit"
            disabled={loading}
            className="shrink-0 rounded-[1.05rem] px-5 py-3 text-sm"
          >
            {loading ? "Working" : "Suggest"}
          </Button>
        </div>
      </form>

      {loading ? (
        <div className="mt-10 w-full max-w-xs">
          <div className="loader-line rounded-full" />
          <p
            key={step}
            className="mt-4 text-center text-sm text-[var(--muted)]"
            style={{ animation: "fade 0.4s ease" }}
          >
            {STEPS[step]}
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="rise mt-10 max-w-md text-center text-sm text-[#9a3412]">
          {error}
        </p>
      ) : null}

      {result ? (
        <section className="rise mt-16 w-full">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
            {displayHost(result.url)}
          </p>
          <h2 className="display mt-2 text-[2rem] leading-tight">
            {result.site.title}
          </h2>
          {result.site.what_it_is ? (
            <p className="mt-3 text-[15px] leading-7 text-[var(--muted)]">
              {result.site.what_it_is}
            </p>
          ) : null}

          {result.matches.length === 0 ? (
            <p className="mt-10 text-sm leading-6 text-[var(--muted)]">
              Nobody in the catalog fits yet. If you can help this kind of
              site,{" "}
              <Button href="/list" variant="ghost" className="inline rounded-md px-1 py-0.5 text-sm underline decoration-[var(--line)] underline-offset-4">
                get listed for $20
              </Button>
              .
            </p>
          ) : (
            <ul className="mt-10 flex flex-col gap-3">
              {result.matches.map((match, index) => (
                <li
                  key={match.id}
                  className="card rise rounded-[1.35rem] p-5"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
                        {KIND_LABELS[match.kind]}
                      </p>
                      <h3 className="mt-1 text-lg font-medium tracking-tight">
                        {match.name}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {match.tagline}
                      </p>
                    </div>
                    <Button
                      href={`/go/${match.id}?from=${encodeURIComponent(result.url)}`}
                      variant="pill"
                      className="shrink-0 px-4 py-2 text-sm"
                    >
                      Visit
                    </Button>
                  </div>
                  <p className="mt-4 text-[15px] leading-6">{match.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
