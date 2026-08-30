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
import { stripProcessTalk } from "./reason-copy";
import type { CatalogListing, SiteBrief, SuggestionMatch } from "./types";
import { displayHost } from "./url";
import { embedTexts } from "./voyage";

type BriefPayload = {
  title?: string;
  what_it_is?: string;
  needs?: string[];
  search_queries?: string[];
  facts?: string[];
};

type PickPayload = {
  matches?: Array<{ id: number; reason: string }>;
};

const BRIEF_SYSTEM = `You read a landing page and find growth openings this business does not cover yet.

Return JSON only:
{"title":"","what_it_is":"","needs":[""],"search_queries":[""],"facts":[""]}

Rules:
- title: the product or person name.
- what_it_is: one or two concrete sentences about what they sell and to whom.
- facts: 3 to 5 observations from the excerpt (audience, motion, CTA, pricing, what the page is thin on). Do not invent.
- needs: 3 to 5 GROWTH OPENINGS, not job titles. Examples: creator payouts, brand-deal CRM, owned audience, trust/reviews, analytics on take-rate, scheduling. Never write "you need a designer" unless the page is clearly unusable.
- search_queries: 3 to 5 queries for complementary STARTUPS, apps, or agencies already in a catalog (payments, CRM, analytics, email, auth, legal, hosting). Do not search for freelance designers or copywriters.
- Prefer complementary companies over clones. English. No fluff.`;

const PICK_SYSTEM = `You pick catalog listings that this URL actually needs, using only what is visible on their landing page.

Return JSON only:
{"matches":[{"id":1,"reason":""}]}

Rules:
- Only use IDs from the candidate list. Never invent IDs.
- Return between 1 and ${MATCH_LIMIT} matches. Never return 0 if any candidate fills a real gap on the page. Prefer 3 distinct openings when their site supports them. Do not pad with weak picks just to hit 3.
- Do not recommend a launcher, email client, or adjacent consumer app unless the page itself is about that job.
- Do not recommend clones of the visitor's product.
- Cover distinct needs. Do not pick two CRMs or two analytics tools.
- reason: 2 sentences, as if you noticed something on their startup, landing page, product, agency site, or company URL. Mention a concrete detail (offer, CTA, audience, missing pricing, missing login). Then say how this listing fills that hole. Never say scrape, crawled, extracted, or that you analyzed a dump. Do not start with the visitor's name. Do not restate the tagline. English.`;

const REASON_SYSTEM = `You write why a catalog listing is necessary for this URL.

Return JSON only:
{"matches":[{"id":1,"reason":"","keep":true}]}

Rules:
- keep=true only if their landing page shows this listing is actually needed now.
- reason: 2 personalized sentences about what you noticed on their site. No visitor name prefix. No generic "worth a look" lines. Never mention scrape, crawling, or extraction.
- If it is a nice-to-have, set keep=false and reason="".`;

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

  const excerpt = input.markdown.slice(0, BRIEF_CHAR_LIMIT);
  const brief = await extractBrief({
    url: input.url,
    title: input.title,
    excerpt,
  });

  const candidates = await retrieveCandidates(brief, pool, visitorHost, excerpt);

  const site: SiteBrief = {
    title: brief.title,
    what_it_is: brief.what_it_is || firstScrapeLine(excerpt),
    needs: brief.needs,
    facts: brief.facts,
  };

  if (!brief.openaiFailed) {
    try {
      const matches = await pickMatches(brief, candidates, excerpt);
      if (matches.length > 0) return { site, matches };
    } catch (error) {
      console.error("pick_failed", error);
      if (!isOpenAiAuthError(error)) {
        try {
          const rewritten = await reasonMatches(brief, candidates, excerpt);
          if (rewritten.length > 0) return { site, matches: rewritten };
        } catch (reasonError) {
          console.error("reason_failed", reasonError);
        }
      }
    }
  }

  return { site, matches: fallbackFromScrape(brief, excerpt, candidates) };
}

async function extractBrief(input: {
  url: string;
  title: string | null;
  excerpt: string;
}): Promise<SiteBrief & { search_queries: string[]; openaiFailed?: boolean }> {
  const fallback: SiteBrief & { search_queries: string[]; openaiFailed?: boolean } = {
    title: input.title?.trim() || input.url,
    what_it_is: firstScrapeLine(input.excerpt),
    needs: [],
    facts: [],
    search_queries: [],
  };

  try {
    const raw = await lunaJson(
      BRIEF_SYSTEM,
      [
        `Visitor URL: ${input.url}`,
        input.title ? `Detected title: ${input.title}` : "",
        "",
        "Landing excerpt:",
        input.excerpt,
      ]
        .filter(Boolean)
        .join("\n"),
    );
    const parsed = parseJsonObject<BriefPayload>(raw);
    const needs = cleanList(parsed.needs, 5).filter((item) => !isJobTitle(item));
    const facts = cleanList(parsed.facts, 5);
    const search_queries = cleanList(parsed.search_queries, 5).filter(
      (item) => !isJobTitle(item),
    );
    return {
      title: parsed.title?.trim() || fallback.title,
      what_it_is: parsed.what_it_is?.trim() || "",
      needs,
      facts,
      search_queries,
    };
  } catch (error) {
    console.error("brief_failed", error);
    return { ...fallback, openaiFailed: isOpenAiAuthError(error) };
  }
}

async function retrieveCandidates(
  brief: SiteBrief & { search_queries: string[] },
  pool: CatalogListing[],
  visitorHost: string,
  excerpt: string,
): Promise<Array<CatalogListing & { similarity: number; explore_rank: number }>> {
  if (pool.length === 0) return [];

  const rankedPool = [...pool].sort(
    (a, b) => kindPriority(a.kind) - kindPriority(b.kind),
  );

  if (!process.env.VOYAGE_API_KEY || pool.length <= 4) {
    return rankedPool.map((listing, index) => ({
      ...listing,
      similarity: 1,
      explore_rank: index,
    }));
  }

  try {
    const queries = catalogQueries(brief, excerpt);
    const vectors = await embedTexts(queries, "query");
    const hits = (
      await Promise.all(
        vectors.map((query) => searchListingsByEmbedding(query, 20)),
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
      .sort((a, b) => {
        const kindDelta = kindPriority(a.listing.kind) - kindPriority(b.listing.kind);
        if (Math.abs(a.similarity - b.similarity) < 0.04 && kindDelta !== 0) {
          return kindDelta;
        }
        return b.similarity - a.similarity;
      });

    const withScore = ranked.filter((row) => row.similarity > 0);
    const usable = withScore.length > 0 ? withScore : ranked;
    const top = usable[0]?.similarity ?? 0;
    const band = Math.max(0.1, top - 0.16);
    const eligible = usable.filter((row) => row.similarity >= band);

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
    return rankedPool.slice(0, CANDIDATE_LIMIT).map((listing, index) => ({
      ...listing,
      similarity: 0,
      explore_rank: index,
    }));
  }
}

async function pickMatches(
  brief: SiteBrief,
  candidates: Array<CatalogListing & { similarity: number; explore_rank: number }>,
  excerpt: string,
): Promise<SuggestionMatch[]> {
  if (candidates.length === 0) return [];

  const compact = candidates.map((listing) => ({
    id: listing.id,
    name: listing.name,
    kind: listing.kind,
    tagline: listing.tagline,
    description: listing.description.slice(0, 260),
    explore_rank: listing.explore_rank,
  }));

  const raw = await lunaJson(
    PICK_SYSTEM,
    [
      `Site: ${brief.title}`,
      brief.what_it_is ? `What it is: ${brief.what_it_is}` : "",
      brief.facts.length ? `Facts from their page: ${brief.facts.join("; ")}` : "",
      brief.needs.length ? `Growth openings: ${brief.needs.join("; ")}` : "",
      "",
      "Their landing page:",
      excerpt.slice(0, 2400),
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
    if (isStaffingListing(listing) && candidates.some((row) => !isStaffingListing(row))) {
      continue;
    }
    const reason = cleanReason(brief, listing, match.reason);
    if (!reason) continue;
    seen.add(listing.id);
    matches.push({
      id: listing.id,
      name: listing.name,
      kind: listing.kind,
      url: listing.url,
      tagline: listing.tagline,
      reason,
    });
    if (matches.length === MATCH_LIMIT) break;
  }

  return matches;
}

async function reasonMatches(
  brief: SiteBrief,
  candidates: Array<CatalogListing & { similarity: number; explore_rank: number }>,
  excerpt: string,
): Promise<SuggestionMatch[]> {
  const pool = candidates
    .filter((listing) => !isStaffingListing(listing))
    .slice(0, 8);
  if (pool.length === 0) return [];

  const raw = await lunaJson(
    REASON_SYSTEM,
    [
      `Site: ${brief.title}`,
      brief.what_it_is ? `What it is: ${brief.what_it_is}` : "",
      brief.facts.length ? `Facts from their page: ${brief.facts.join("; ")}` : "",
      brief.needs.length ? `Openings: ${brief.needs.join("; ")}` : "",
      "",
      "Their landing page:",
      excerpt.slice(0, 2400),
      "",
      "Candidates:",
      JSON.stringify(
        pool.map((listing) => ({
          id: listing.id,
          name: listing.name,
          kind: listing.kind,
          tagline: listing.tagline,
          description: listing.description.slice(0, 220),
        })),
      ),
    ]
      .filter(Boolean)
      .join("\n"),
  );

  const parsed = parseJsonObject<PickPayload & { matches?: Array<{ keep?: boolean }> }>(raw);
  const byId = new Map(pool.map((listing) => [listing.id, listing]));
  const matches: SuggestionMatch[] = [];

  for (const match of parsed.matches ?? []) {
    const listing = byId.get(match.id);
    if (!listing) continue;
    if (match.keep === false) continue;
    const reason = cleanReason(brief, listing, match.reason);
    if (!reason) continue;
    matches.push({
      id: listing.id,
      name: listing.name,
      kind: listing.kind,
      url: listing.url,
      tagline: listing.tagline,
      reason,
    });
    if (matches.length === MATCH_LIMIT) break;
  }

  return matches;
}

function fallbackFromScrape(
  brief: SiteBrief,
  excerpt: string,
  candidates: Array<CatalogListing & { similarity: number; explore_rank: number }>,
): SuggestionMatch[] {
  const observed = firstScrapeLine(excerpt) || brief.what_it_is || brief.title;
  const preferred = candidates.filter((listing) => !isStaffingListing(listing));
  const pool = preferred.length > 0 ? preferred : candidates;

  return pool.slice(0, 3).map((listing) => ({
    id: listing.id,
    name: listing.name,
    kind: listing.kind,
    url: listing.url,
    tagline: listing.tagline,
    reason: scrapeFallbackReason(listing, observed),
  }));
}

function scrapeFallbackReason(listing: CatalogListing, observed: string): string {
  const capability = listing.description.split(". ")[0]?.replace(/\.$/, "") || listing.tagline;
  const detail = observed.replace(/\.$/, "");
  return `${capability}. Their page leads with “${detail}”, so this is a concrete next piece they do not ship themselves.`;
}

function firstScrapeLine(excerpt: string): string {
  const lines = excerpt
    .split("\n")
    .map((line) => line.replace(/^#+\s*/, "").replace(/[*_`]/g, "").trim())
    .filter((line) => line.length > 24 && line.length < 180 && !/^https?:\/\//i.test(line));
  return lines[0] ?? "";
}

function isOpenAiAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const status = "status" in error ? error.status : null;
  const message = "message" in error && typeof error.message === "string" ? error.message : "";
  return status === 401 || /invalid_api_key|Incorrect API key/i.test(message);
}

function cleanReason(
  brief: SiteBrief,
  listing: CatalogListing,
  rawReason?: string,
): string | null {
  const written = stripProcessTalk(stripSitePrefix(brief, rawReason?.trim() ?? ""));
  if (!written) return null;
  if (written.toLowerCase() === listing.tagline.trim().toLowerCase()) return null;
  if (isCannedReason(written)) return null;
  return written;
}

function stripSitePrefix(brief: SiteBrief, text: string): string {
  if (!text) return "";
  const names = [brief.title, brief.title.replace(/\s+[—|:].*$/, "")]
    .map((name) => name.trim())
    .filter((name) => name.length > 2);
  let next = text;
  for (const name of names) {
    next = next.replace(new RegExp(`^(${escapeRegExp(name)}\\s*[:—|-]\\s*)+`, "i"), "");
    next = next.replace(new RegExp(`^${escapeRegExp(name)}\\s+is\\s+`, "i"), "This site is ");
  }
  return next.trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function catalogQueries(
  brief: SiteBrief & { search_queries: string[] },
  excerpt: string,
): string[] {
  const subject = brief.what_it_is || brief.title;
  const fromModel = brief.search_queries.filter((query) => !isJobTitle(query));
  const fromNeeds = brief.needs
    .filter((need) => !isJobTitle(need))
    .map((need) => `${subject} needs ${need}`);
  const grounded = excerpt.trim() ? excerpt.slice(0, 420) : "";
  return uniqueStrings([
    ...fromModel,
    ...fromNeeds,
    grounded,
    subject ? `${subject} complementary infrastructure they still lack` : "",
  ]).slice(0, 5);
}

function isJobTitle(value: string): boolean {
  return /freelance|copywriter|product designer|hire a|need a designer|need a developer|mvp and apis/i.test(
    value,
  );
}

function isCannedReason(value: string): boolean {
  return /complementary fit for|keep shipping their core product|growth gap their landing page|worth a look if they want a partner already doing this/i.test(
    value,
  );
}

function isStaffingListing(listing: CatalogListing): boolean {
  if (listing.kind === "freelancer" || listing.kind === "content_creator") return true;
  return /freelance|copy and positioning|product design for early-stage/i.test(
    `${listing.tagline} ${listing.description}`,
  );
}

function kindPriority(kind: CatalogListing["kind"]): number {
  if (kind === "startup") return 0;
  if (kind === "agency") return 1;
  if (kind === "consumer_app") return 2;
  if (kind === "content_creator") return 3;
  return 4;
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const items: string[] = [];
  for (const value of values) {
    const text = value.trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(text);
  }
  return items;
}

function cleanList(values: string[] | undefined, max: number): string[] {
  return uniqueStrings(values ?? []).slice(0, max);
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

  const ordered = [...picked].sort(
    (a, b) => kindPriority(a.listing.kind) - kindPriority(b.listing.kind),
  );

  for (const row of ordered) {
    if ((counts.get(row.listing.kind) ?? 0) >= 2) continue;
    take(row);
  }

  for (const row of pool) {
    if (result.length >= limit) break;
    if ((counts.get(row.listing.kind) ?? 0) >= 2) continue;
    take(row);
  }

  for (const row of ordered) {
    if (result.length >= limit) break;
    take(row);
  }

  return result;
}
