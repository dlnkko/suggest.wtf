import { createClient } from "./supabase/server";
import { createSupabaseServer } from "./supabase";
import { isListingKind, type ListingKind } from "./constants";
import { embedTexts, listingEmbedText } from "./voyage";

function asKind(value: string): ListingKind {
  return isListingKind(value) ? value : "freelancer";
}

export async function searchListingsByEmbedding(
  query: number[],
  matchCount = 16,
): Promise<Array<{ id: number; similarity: number }>> {
  const supabase = createSupabaseServer();
  const { data, error } = await supabase.rpc("match_listings", {
    p_query: query,
    p_match_count: matchCount,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: { id: number; similarity: number }) => ({
    id: Number(row.id),
    similarity: Number(row.similarity),
  }));
}

export async function embedAndStoreListing(
  listing: {
    id: number;
    name: string;
    kind: string;
    tagline: string;
    description: string;
  },
  authed: boolean,
): Promise<void> {
  const [embedding] = await embedTexts(
    [
      listingEmbedText({
        name: listing.name,
        kind: listing.kind,
        tagline: listing.tagline,
        description: listing.description,
      }),
    ],
    "document",
  );

  const supabase = authed ? await createClient() : createSupabaseServer();
  const { error } = await supabase.rpc("set_listing_embedding", {
    p_id: listing.id,
    p_embedding: embedding,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function embedMissingListings(): Promise<void> {
  if (!process.env.VOYAGE_API_KEY) return;

  const supabase = createSupabaseServer();
  const { data, error } = await supabase.rpc("listings_needing_embedding");
  if (error) {
    throw new Error(error.message);
  }

  const missing = (data ?? []).map(
    (row: {
      id: number;
      name: string;
      kind: string;
      tagline: string;
      description: string;
    }) => ({
      id: Number(row.id),
      name: String(row.name),
      kind: asKind(String(row.kind)),
      tagline: String(row.tagline),
      description: String(row.description),
    }),
  );

  if (missing.length === 0) return;

  const vectors = await embedTexts(
    missing.map((item) => listingEmbedText(item)),
    "document",
  );

  await Promise.all(
    missing.map(async (listing, index) => {
      const embedding = vectors[index];
      if (!embedding) return;
      const { error: setError } = await supabase.rpc("set_listing_embedding", {
        p_id: listing.id,
        p_embedding: embedding,
      });
      if (setError) {
        console.error("listing_embed_failed", listing.id, setError.message);
      }
    }),
  );
}
