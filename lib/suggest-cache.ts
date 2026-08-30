import { stripProcessTalk } from "@/lib/reason-copy";
import type { SuggestResponse } from "@/lib/types";

const memory = new Map<string, SuggestResponse>();
const inflight = new Map<string, Promise<SuggestResponse>>();

function storageKey(url: string): string {
  return `suggest:v2:${url}`;
}

export function readSuggestCache(url: string): SuggestResponse | null {
  const hit = memory.get(url);
  if (hit) return hit;
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(url));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SuggestResponse;
    if (!parsed?.url || !parsed.site) return null;
    memory.set(url, parsed);
    return parsed;
  } catch {
    return null;
  }
}

export function writeSuggestCache(url: string, result: SuggestResponse) {
  memory.set(url, result);
  try {
    sessionStorage.setItem(storageKey(url), JSON.stringify(result));
  } catch {
    // Private mode or quota.
  }
}

export function suggestForUrl(url: string): Promise<SuggestResponse> {
  const cached = readSuggestCache(url);
  if (cached) return Promise.resolve(cached);

  const pending = inflight.get(url);
  if (pending) return pending;

  const request = (async () => {
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
    const cleaned: SuggestResponse = {
      ...payload,
      matches: (payload.matches ?? []).map((match) => ({
        ...match,
        reason: stripProcessTalk(match.reason),
      })),
    };
    writeSuggestCache(url, cleaned);
    return cleaned;
  })().finally(() => {
    inflight.delete(url);
  });

  inflight.set(url, request);
  return request;
}
