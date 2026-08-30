import { CATALOG_REFRESH_EVERY } from "@/lib/constants";
import { stripProcessTalk } from "@/lib/reason-copy";
import type { SuggestResponse } from "@/lib/types";

const memory = new Map<string, SuggestResponse>();
const inflight = new Map<string, Promise<SuggestResponse>>();

function storageKey(url: string): string {
  return `suggest:v5:${url}`;
}

export function readSuggestCache(
  url: string,
  catalogCount: number,
): SuggestResponse | null {
  const hit = memory.get(url);
  if (hit && isFresh(hit, catalogCount)) return hit;
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(url));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SuggestResponse;
    if (!parsed?.url || !parsed.site) return null;
    if (!isFresh(parsed, catalogCount)) return null;
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

export function suggestForUrl(
  url: string,
  catalogCount: number,
): Promise<SuggestResponse> {
  const cached = readSuggestCache(url, catalogCount);
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
      catalog_count: payload.catalog_count ?? catalogCount,
      catalog_revision: payload.catalog_revision || String(catalogCount),
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

function isFresh(result: SuggestResponse, catalogCount: number): boolean {
  if (!catalogCount) return true;
  const saved =
    typeof result.catalog_count === "number"
      ? result.catalog_count
      : Number(String(result.catalog_revision ?? "").split(":")[0]) || 0;
  if (catalogCount < saved) return false;
  return catalogCount - saved < CATALOG_REFRESH_EVERY;
}
