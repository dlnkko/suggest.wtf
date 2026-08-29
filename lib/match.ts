import {
  BRIEF_CHAR_LIMIT,
  CANDIDATE_LIMIT,
  MATCH_LIMIT,
} from "./constants";
import {
  embedMissingListings,
  searchListingsByEmbedding,
} from "./embeddings";
import { lunaJson, parseJsonObject } from "./openai";
import type { CatalogListing, SiteBrief, SuggestionMatch } from "./types";
import { displayHost } from "./url";
import { embedTexts } from "./voyage";

type BriefPayload = {
  title?: string;
  what_it_is?: string;
  needs?: string[];
  search_queries?: string[];
};

type PickPayload = {
  matches?: Array<{ id: number; reason: string }>;
};

const BRIEF_SYSTEM = `You read a landing page and decide what would HELP this business next.

Return JSON only:
{"title":"","what_it_is":"","needs":[""],"search_queries":[""]}

Rules:
- title: the product or person name.
- what_it_is: one or two concrete sentences.
- needs: 3 to 5 gaps this site likely has now (design, growth, copy, legal, engineering, content, ops, etc.).
- search_queries: 3 to 5 short retrieval queries for people, agencies, or products that FILL those gaps.
- Prefer complementary help over clones. Do not search for competitors that do the same thing.
- English. No marketing fluff.`;

const PICK_SYSTEM = `You pick paid catalog listings that would actually help THIS site.

Return JSON only:
{"matches":[{"id":1,"reason":""}]}

Rules:
- Only use IDs from the candidate list. Never invent IDs.
- Maximum ${MATCH_LIMIT} matches, best first. Zero is allowed.
- Complementary > similar. Do not recommend clones of the visitor's product.
- Cover distinct needs when you can (e.g. a designer AND a growth agency, not five designers).
- If several listings solve the same need, prefer the one with lower explore_rank.
- Only pick a listing if it can really help this site. Coherence first.
- reason: 1 or 2 sentences, specific to THIS site. English.`;

export async function matchListings(input: {
  url: string;
  title: string | null;
  markdown: string;
  listings: CatalogListing[];
}): Promise<{ site: SiteBrief; matches: SuggestionMatch[] }> {
  const visitorHost = displayHost(input.url);
  const pool = input.listings.filter(
    (listing) => displayHost(listing.url) !== visitorHost,
  );

  await embedMissingListings().catch((error) => {
    console.error("embed_missing_failed", error);
  });

  const brief = await extractBrief({
    url: input.url,
    title: input.title,
    markdown: input.markdown,
  });

  const candidates = await retrieveCandidates(brief, pool, visitorHost);

  const site: SiteBrief = {
    title: brief.title,
    what_it_is: brief.what_it_is,
    needs: brief.needs,
  };

  try {
    const matches = await pickMatches(brief, candidates);
    return { site, matches };
  } catch (error) {
    console.error("pick_failed", error);
    return { site, matches: fallbackPicks(candidates) };
  }
}

async function extractBrief(input: {
  url: string;
  title: string | null;
  markdown: string;
}): Promise<SiteBrief & { search_queries: string[] }> {
  const excerpt = input.markdown.slice(0, BRIEF_CHAR_LIMIT);
  const fallback: SiteBrief & { search_queries: string[] } = {
    title: input.title?.trim() || input.url,
    what_it_is: "",
    needs: [],
    search_queries: [
      "freelance product designer for startups",
      "B2B lead generation or paid growth agency",
      "content creation or copywriting for landing pages",
      "freelance developer for MVP and APIs",
      "startup legal contracts and privacy",
    ],
  };

  try {
    const raw = await lunaJson(
      BRIEF_SYSTEM,
      [
        `Visitor URL: ${input.url}`,
        input.title ? `Detected title: ${input.title}` : "",
        "",
        "Landing excerpt:",
        excerpt,
      ]
        .filter(Boolean)
        .join("\n"),
    );
    const parsed = parseJsonObject<BriefPayload>(raw);
    const needs = cleanList(parsed.needs, 5);
    const search_queries = cleanList(parsed.search_queries, 5);
    return {
      title: parsed.title?.trim() || fallback.title,
      what_it_is: parsed.what_it_is?.trim() || "",
      needs,
      search_queries: search_queries.length > 0 ? search_queries : fallback.search_queries,
    };
  } catch (error) {
    console.error("brief_failed", error);
    return fallback;
  }
}

async function retrieveCandidates(
  brief: SiteBrief & { search_queries: string[] },
  pool: CatalogListing[],
  visitorHost: string,
): Promise<Array<CatalogListing & { similarity: number; explore_rank: number }>> {
  if (pool.length === 0) return [];

  if (!process.env.VOYAGE_API_KEY || pool.length <= 4) {
    return pool.map((listing, index) => ({
      ...listing,
      similarity: 1,
      explore_rank: index,
    }));
  }

  try {
    const queries = brief.search_queries.slice(0, 5);
    const vectors = await embedTexts(queries, "query");
    const hits = (
      await Promise.all(
        vectors.map((query) => searchListingsByEmbedding(query, 16)),
      )
    ).flat();

    const best = new Map<number, number>();
    for (const hit of hits) {
      const previous = best.get(hit.id) ?? 0;
      if (hit.similarity > previous) best.set(hit.id, hit.similarity);
    }

    const ranked = pool
      .map((listing) => ({
        listing,
        similarity: best.get(listing.id) ?? 0,
      }))
      .filter((row) => displayHost(row.listing.url) !== visitorHost)
      .sort((a, b) => b.similarity - a.similarity);

    const withScore = ranked.filter((row) => row.similarity > 0);
    const usable = withScore.length > 0 ? withScore : ranked;
    const top = usable[0]?.similarity ?? 0;
    const band = Math.max(0.12, top - 0.12);
    const eligible = usable.filter((row) => row.similarity >= band || row.similarity === 0);

    const head = eligible.slice(0, Math.ceil(CANDIDATE_LIMIT / 2));
    const rest = eligible.slice(head.length);
    const rng = seededRng(`${visitorHost}|${utcDay()}`);
    const explore = shuffle(rest, rng).slice(0, CANDIDATE_LIMIT - head.length);

    const mixed = [...head, ...explore];
    const diversified = diversifyByKind(mixed, eligible, CANDIDATE_LIMIT);

    return diversified.map((row, index) => ({
      ...row.listing,
      similarity: row.similarity,
      explore_rank: index < head.length ? 0 : 1,
    }));
  } catch (error) {
    console.error("retrieve_failed", error);
    return pool.map((listing, index) => ({
      ...listing,
      similarity: 0,
      explore_rank: index,
    }));
  }
}

async function pickMatches(
  brief: SiteBrief,
  candidates: Array<CatalogListing & { similarity: number; explore_rank: number }>,
): Promise<SuggestionMatch[]> {
  if (candidates.length === 0) return [];

  const compact = candidates.map((listing) => ({
    id: listing.id,
    name: listing.name,
    kind: listing.kind,
    tagline: listing.tagline,
    description: listing.description.slice(0, 220),
    explore_rank: listing.explore_rank,
  }));

  const raw = await lunaJson(
    PICK_SYSTEM,
    [
      `Site: ${brief.title}`,
      brief.what_it_is ? `What it is: ${brief.what_it_is}` : "",
      brief.needs.length ? `Needs: ${brief.needs.join("; ")}` : "",
      "",
      "Candidates (only these IDs):",
      JSON.stringify(compact),
    ]
      .filter(Boolean)
      .join("\n"),
  );

  const parsed = parseJsonObject<PickPayload>(raw);
  const byId = new Map(candidates.map((listing) => [listing.id, listing]));
  const seen = new Set<number>();
  const matches: SuggestionMatch[] = [];

  for (const match of parsed.matches ?? []) {
    const listing = byId.get(match.id);
    if (!listing || seen.has(listing.id)) continue;
    seen.add(listing.id);
    matches.push({
      id: listing.id,
      name: listing.name,
      kind: listing.kind,
      url: listing.url,
      tagline: listing.tagline,
      reason: match.reason?.trim() || listing.tagline,
    });
    if (matches.length === MATCH_LIMIT) break;
  }

  return matches;
}

function fallbackPicks(
  candidates: Array<CatalogListing & { similarity: number; explore_rank: number }>,
): SuggestionMatch[] {
  return candidates.slice(0, MATCH_LIMIT).map((listing) => ({
    id: listing.id,
    name: listing.name,
    kind: listing.kind,
    url: listing.url,
    tagline: listing.tagline,
    reason: listing.tagline,
  }));
}

function cleanList(values: string[] | undefined, max: number): string[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  const items: string[] = [];
  for (const value of values) {
    const text = value?.trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(text);
    if (items.length === max) break;
  }
  return items;
}

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

function seededRng(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function diversifyByKind(
  picked: Array<{ listing: CatalogListing; similarity: number }>,
  pool: Array<{ listing: CatalogListing; similarity: number }>,
  limit: number,
): Array<{ listing: CatalogListing; similarity: number }> {
  const result: Array<{ listing: CatalogListing; similarity: number }> = [];
  const counts = new Map<string, number>();
  const used = new Set<number>();

  function take(row: { listing: CatalogListing; similarity: number }) {
    if (used.has(row.listing.id) || result.length >= limit) return;
    used.add(row.listing.id);
    counts.set(row.listing.kind, (counts.get(row.listing.kind) ?? 0) + 1);
    result.push(row);
  }

  for (const row of picked) {
    if ((counts.get(row.listing.kind) ?? 0) >= 2) continue;
    take(row);
  }

  for (const row of pool) {
    if (result.length >= limit) break;
    if ((counts.get(row.listing.kind) ?? 0) >= 2) continue;
    take(row);
  }

  for (const row of picked) {
    if (result.length >= limit) break;
    take(row);
  }

  return result;
}
