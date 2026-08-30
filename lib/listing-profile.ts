import { scrapeLanding } from "@/lib/firecrawl";
import { lunaJson, parseJsonObject } from "@/lib/openai";
import { createSupabaseServer } from "@/lib/supabase";
import type { ListingKind } from "@/lib/constants";
import type { ListingProfile } from "@/lib/types";
import { helpsEmbedText, offerEmbedText, embedTexts } from "@/lib/voyage";

type ProfilePayload = {
  sells?: string;
  serves?: string;
  helps_with?: string[];
  proof?: string[];
  avoid?: string[];
};

const PROFILE_SYSTEM = `You turn a listed company into a matching profile for a complementary catalog.

Return JSON only:
{"sells":"","serves":"","helps_with":[""],"proof":[""],"avoid":[""]}

Rules:
- sells: one concrete sentence about what they sell.
- serves: who they serve (role, stage, or industry).
- helps_with: 3 to 6 jobs they fill for ANOTHER company. Examples: payments, auth, email, CRM, analytics, scheduling, legal. Not "they are a CRM".
- proof: 3 to 5 details from their landing or the form copy. Do not invent.
- avoid: 2 to 4 cases they should not be recommended, especially clones or the same product category.
- English. No fluff. Never mention scrape.`;

export function parseListingProfile(value: unknown): ListingProfile | null {
  if (!value || typeof value !== "object") return null;
  const row = value as ProfilePayload;
  const sells = row.sells?.trim() ?? "";
  const serves = row.serves?.trim() ?? "";
  const helps_with = clean(row.helps_with, 6);
  const proof = clean(row.proof, 5);
  const avoid = clean(row.avoid, 4);
  if (!sells && !serves && helps_with.length === 0) return null;
  return { sells, serves, helps_with, proof, avoid };
}

export function profileFromCopy(input: {
  name: string;
  kind: string;
  tagline: string;
  description: string;
}): ListingProfile {
  return {
    sells: input.description.trim() || input.tagline.trim() || input.name,
    serves: input.tagline.trim(),
    helps_with: [input.tagline, input.description].filter(Boolean).slice(0, 3),
    proof: [input.tagline, input.description].filter(Boolean).slice(0, 3),
    avoid: [`A clone of ${input.name}`],
  };
}

export async function enrichListingProfile(
  input: {
    id: number;
    name: string;
    kind: ListingKind | string;
    url: string;
    tagline: string;
    description: string;
  },
  authed: boolean,
): Promise<void> {
  let scrapeMarkdown = "";
  let scrapeTitle: string | null = null;
  try {
    const scraped = await scrapeLanding(input.url);
    scrapeMarkdown = scraped.markdown;
    scrapeTitle = scraped.title;
  } catch (error) {
    console.error("listing_scrape_failed", input.id, error);
  }

  let profile = profileFromCopy(input);
  try {
    profile = await buildListingProfile(input, scrapeMarkdown, scrapeTitle);
  } catch (error) {
    console.error("listing_profile_failed", input.id, error);
  }

  const [offer, helps] = await embedTexts(
    [
      offerEmbedText({
        name: input.name,
        kind: input.kind,
        tagline: input.tagline,
        description: input.description,
        profile,
      }),
      helpsEmbedText({
        name: input.name,
        kind: input.kind,
        tagline: input.tagline,
        profile,
      }),
    ],
    "document",
  );

  if (!offer || !helps) {
    throw new Error("listing_profile_embed_failed");
  }

  const supabase = authed
    ? await (await import("@/lib/supabase/server")).createClient()
    : createSupabaseServer();
  const { error } = await supabase.rpc("set_listing_profile", {
    p_id: input.id,
    p_scrape_markdown: scrapeMarkdown || null,
    p_scrape_title: scrapeTitle,
    p_profile: profile,
    p_offer: offer,
    p_helps: helps,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function profileMissingListings(limit = 2): Promise<void> {
  if (!process.env.FIRECRAWL_API_KEY || !process.env.VOYAGE_API_KEY) return;

  const supabase = createSupabaseServer();
  const { data, error } = await supabase.rpc("listings_needing_profile");
  if (error) {
    throw new Error(error.message);
  }

  const rows = (Array.isArray(data) ? data : []).slice(0, limit);
  for (const [index, row] of rows.entries()) {
    if (index > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    try {
      await enrichListingProfile(
        {
          id: Number(row.id),
          name: String(row.name),
          kind: String(row.kind),
          url: String(row.url),
          tagline: String(row.tagline),
          description: String(row.description),
        },
        false,
      );
    } catch (profileError) {
      console.error("listing_profile_failed", row.id, profileError);
    }
  }
}

async function buildListingProfile(
  input: {
    name: string;
    kind: string;
    tagline: string;
    description: string;
    url: string;
  },
  excerpt: string,
  title: string | null,
): Promise<ListingProfile> {
  const fallback = profileFromCopy(input);
  const raw = await lunaJson(
    PROFILE_SYSTEM,
    [
      `Name: ${input.name}`,
      `Kind: ${input.kind.replaceAll("_", " ")}`,
      `URL: ${input.url}`,
      `Tagline: ${input.tagline}`,
      `Description: ${input.description}`,
      title ? `Landing title: ${title}` : "",
      excerpt ? `\nLanding page:\n${excerpt.slice(0, 3200)}` : "No landing page available. Use the form copy only.",
    ]
      .filter(Boolean)
      .join("\n"),
  );
  const parsed = parseListingProfile(parseJsonObject<ProfilePayload>(raw));
  if (!parsed) return fallback;
  return {
    sells: parsed.sells || fallback.sells,
    serves: parsed.serves || fallback.serves,
    helps_with: parsed.helps_with.length ? parsed.helps_with : fallback.helps_with,
    proof: parsed.proof.length ? parsed.proof : fallback.proof,
    avoid: parsed.avoid.length ? parsed.avoid : fallback.avoid,
  };
}

function clean(values: string[] | undefined, max: number): string[] {
  const seen = new Set<string>();
  const items: string[] = [];
  for (const value of values ?? []) {
    const text = value.trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(text);
    if (items.length >= max) break;
  }
  return items;
}
