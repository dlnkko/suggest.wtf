"use client";

import { Button } from "@/components/button";
import { KIND_LABELS } from "@/lib/constants";
import type { SuggestResponse } from "@/lib/types";
import { faviconUrl } from "@/lib/url";
import { useEffect, useState } from "react";

const STEPS = [
  "Reading your site",
  "Finding the opening",
  "Matching the catalog",
];

function siteName(title: string): string {
  return title.split(/\s+[—–|:]\s+/)[0]?.trim() || title;
}

export function SuggestRun({ url }: { url: string }) {
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SuggestResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timers = [
      window.setTimeout(() => setStep(1), 1200),
      window.setTimeout(() => setStep(2), 2800),
    ];

    async function run() {
      try {
        const response = await fetch("/api/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const payload = (await response.json()) as SuggestResponse & {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error || "We couldn’t analyze that URL.");
        }
        if (!cancelled) setResult(payload);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong.");
        }
      } finally {
        timers.forEach(clearTimeout);
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [url]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      {loading ? (
        <div className="mt-8 w-full max-w-xs self-center">
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
        <p className="rise mt-6 max-w-md text-sm text-[#9a3412]">{error}</p>
      ) : null}

      {result ? (
        <section className="rise w-full">
          <div className="flex items-center gap-4">
            <img
              src={faviconUrl(result.url)}
              alt=""
              width={58}
              height={58}
              className="site-favicon site-favicon-lg"
            />
            <h2 className="suggest-name min-w-0">{siteName(result.site.title)}</h2>
          </div>

          {result.matches.length === 0 ? (
            <p className="mt-12 text-sm leading-6 text-[var(--muted)]">
              Nobody in the catalog fits yet. If you can help this kind of
              site,{" "}
              <Button
                href="/list"
                variant="ghost"
                className="inline rounded-md px-1 py-0.5 text-sm underline decoration-[var(--line)] underline-offset-4"
              >
                get listed for $20
              </Button>
              .
            </p>
          ) : (
            <div className="mt-12">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
                Leverage
              </p>
              <ul className="mt-4 flex flex-col gap-4">
                {result.matches.map((match, index) => (
                  <li
                    key={match.id}
                    className="match-card rise"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3.5">
                        <img
                          src={faviconUrl(match.url)}
                          alt=""
                          width={40}
                          height={40}
                          className="site-favicon"
                        />
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
                            {KIND_LABELS[match.kind]}
                          </p>
                          <h3 className="match-name mt-1">{match.name}</h3>
                        </div>
                      </div>
                      <Button
                        href={`/go/${match.id}?from=${encodeURIComponent(result.url)}`}
                        variant="pill"
                        className="shrink-0 px-4 py-2 text-sm"
                      >
                        Visit
                      </Button>
                    </div>
                    <p className="match-why mt-5">{match.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
