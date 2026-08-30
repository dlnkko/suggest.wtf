import { CATALOG_REFRESH_EVERY, MATCH_LIMIT } from "@/lib/constants";
import { scrapeLanding } from "@/lib/firecrawl";
import {
  catalogCountOf,
  catalogRevisionOf,
  getCatalog,
  getSignedInUserId,
} from "@/lib/listings";
import { matchListings } from "@/lib/match";
import {
  readSuggestStore,
  writeSuggestMatches,
  writeSuggestScrape,
} from "@/lib/suggest-store";
import type { CatalogListing, SiteBrief, SuggestionMatch } from "@/lib/types";
import { normalizeUrl } from "@/lib/url";

export const maxDuration = 60;

export async function POST(request: Request) {
  const userId = await getSignedInUserId();
  if (!userId) {
    return Response.json({ error: "Sign in with Google first." }, { status: 401 });
  }

  let body: { url?: unknown };
  try {
    body = (await request.json()) as { url?: unknown };
  } catch {
    return Response.json({ error: "Send a URL to analyze." }, { status: 400 });
  }

  const url = typeof body.url === "string" ? normalizeUrl(body.url) : null;
  if (!url) {
    return Response.json(
      { error: "Paste a URL only (https://your-site.com)." },
      { status: 400 },
    );
  }

  try {
    const listings = await getCatalog();
    const catalogRevision = catalogRevisionOf(listings);
    const catalogCount = listings.length;
    const stored = await readSuggestStore(url);
    const storedCount = catalogCountOf(stored?.catalog_revision ?? "");
    const added = stored ? catalogCount - storedCount : CATALOG_REFRESH_EVERY;
    const live = liveMatches(stored?.matches ?? [], listings);
    const lostMatch = (stored?.matches.length ?? 0) > live.length;
    const due = !stored?.markdown || added >= CATALOG_REFRESH_EVERY;

    if (stored?.site && stored.markdown && !due && !lostMatch) {
      return payload(url, stored.site, live, catalogRevision, catalogCount);
    }

    const scraped =
      due || !stored?.markdown
        ? await scrapeLanding(url)
        : { title: stored.title, markdown: stored.markdown };

    if (due || !stored?.markdown) {
      await writeSuggestScrape({
        url,
        title: scraped.title,
        markdown: scraped.markdown,
      });
    }

    if (stored?.site && live.length >= MATCH_LIMIT) {
      await writeSuggestMatches({
        url,
        catalogRevision,
        site: stored.site,
        matches: live.slice(0, MATCH_LIMIT),
      });
      return payload(
        url,
        stored.site,
        live.slice(0, MATCH_LIMIT),
        catalogRevision,
        catalogCount,
      );
    }

    try {
      const matched = await matchListings({
        url,
        title: scraped.title,
        markdown: scraped.markdown,
        listings,
      });
      const matches = preferKeptMatches(live, matched.matches, listings);
      const site = due || !stored?.site ? matched.site : stored.site;

      await writeSuggestMatches({
        url,
        catalogRevision,
        site,
        matches,
      });

      return payload(url, site, matches, catalogRevision, catalogCount);
    } catch (matchError) {
      console.error("match_failed", matchError);
      const site = stored?.site ?? {
        title: scraped.title || url,
        what_it_is: scraped.markdown.split("\n").find((line) => line.trim()) || url,
        needs: [],
        facts: [],
      };
      return payload(url, site, live, catalogRevision, catalogCount);
    }
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "missing_firecrawl_key") {
      return Response.json(
        { error: "FIRECRAWL_API_KEY is missing in .env.local." },
        { status: 500 },
      );
    }
    if (code === "missing_openai_key") {
      return Response.json(
        { error: "OPENAI_API_KEY is missing in .env.local." },
        { status: 500 },
      );
    }
    if (code === "empty_scrape") {
      return Response.json(
        { error: "We couldn’t read that site. Try another public URL." },
        { status: 422 },
      );
    }

    console.error(error);
    return Response.json(
      { error: "We couldn’t analyze that site. Try again." },
      { status: 500 },
    );
  }
}

function payload(
  url: string,
  site: SiteBrief,
  matches: SuggestionMatch[],
  catalogRevision: string,
  catalogCount: number,
) {
  return Response.json({
    url,
    site,
    matches,
    catalog_revision: catalogRevision,
    catalog_count: catalogCount,
  });
}

function liveMatches(
  matches: SuggestionMatch[],
  listings: CatalogListing[],
): SuggestionMatch[] {
  const live = new Set(listings.map((listing) => listing.id));
  return matches.filter((match) => live.has(match.id));
}

function preferKeptMatches(
  previous: SuggestionMatch[],
  next: SuggestionMatch[],
  listings: CatalogListing[],
): SuggestionMatch[] {
  const live = new Set(listings.map((listing) => listing.id));
  const kept = previous.filter((match) => live.has(match.id));
  if (kept.length >= MATCH_LIMIT) return kept.slice(0, MATCH_LIMIT);

  const seen = new Set(kept.map((match) => match.id));
  for (const match of next) {
    if (kept.length >= MATCH_LIMIT) break;
    if (!live.has(match.id) || seen.has(match.id)) continue;
    kept.push(match);
    seen.add(match.id);
  }
  return kept;
}
