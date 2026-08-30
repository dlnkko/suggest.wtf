import { createClient } from "./supabase/server";
import type { SiteBrief, SuggestionMatch } from "./types";

export type StoredSuggest = {
  url: string;
  catalog_revision: string;
  title: string | null;
  markdown: string;
  scraped_at: string;
  site: SiteBrief | null;
  matches: SuggestionMatch[];
  matched_at: string | null;
};

type CacheRow = {
  url?: string;
  catalog_revision?: string;
  title?: string | null;
  markdown?: string;
  scraped_at?: string;
  site?: SiteBrief | null;
  matches?: SuggestionMatch[];
  matched_at?: string | null;
};

export async function readSuggestStore(url: string): Promise<StoredSuggest | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_suggest_cache", {
      p_url: url,
    });
    if (error) {
      console.error("suggest_cache_read_failed", error);
      return null;
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row !== "object") return null;
    return parseRow(row as CacheRow, url);
  } catch (error) {
    console.error("suggest_cache_read_failed", error);
    return null;
  }
}

export async function writeSuggestScrape(input: {
  url: string;
  title: string | null;
  markdown: string;
  scrapedAt?: Date;
}): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("save_suggest_scrape", {
      p_url: input.url,
      p_title: input.title,
      p_markdown: input.markdown,
      p_scraped_at: (input.scrapedAt ?? new Date()).toISOString(),
    });
    if (error) console.error("suggest_scrape_save_failed", error);
  } catch (error) {
    console.error("suggest_scrape_save_failed", error);
  }
}

export async function writeSuggestMatches(input: {
  url: string;
  catalogRevision: string;
  site: SiteBrief;
  matches: SuggestionMatch[];
}): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("save_suggest_matches", {
      p_url: input.url,
      p_catalog_revision: input.catalogRevision,
      p_site: input.site,
      p_matches: input.matches,
    });
    if (error) console.error("suggest_matches_save_failed", error);
  } catch (error) {
    console.error("suggest_matches_save_failed", error);
  }
}

function parseRow(row: CacheRow, url: string): StoredSuggest | null {
  const markdown = typeof row.markdown === "string" ? row.markdown : "";
  if (!markdown) return null;

  return {
    url: typeof row.url === "string" ? row.url : url,
    catalog_revision:
      typeof row.catalog_revision === "string" ? row.catalog_revision : "",
    title: typeof row.title === "string" && row.title.trim() ? row.title : null,
    markdown,
    scraped_at: typeof row.scraped_at === "string" ? row.scraped_at : "",
    site: isSiteBrief(row.site) ? row.site : null,
    matches: Array.isArray(row.matches) ? row.matches.filter(isMatch) : [],
    matched_at: typeof row.matched_at === "string" ? row.matched_at : null,
  };
}

function isSiteBrief(value: unknown): value is SiteBrief {
  if (!value || typeof value !== "object") return false;
  const row = value as SiteBrief;
  return typeof row.title === "string" && typeof row.what_it_is === "string";
}

function isMatch(value: unknown): value is SuggestionMatch {
  if (!value || typeof value !== "object") return false;
  const row = value as SuggestionMatch;
  return (
    typeof row.id === "number" &&
    typeof row.name === "string" &&
    typeof row.url === "string" &&
    typeof row.reason === "string"
  );
}
