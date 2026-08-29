const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const voyage = process.env.VOYAGE_API_KEY;

if (!url || !key || !voyage) {
  throw new Error("Missing Supabase or Voyage env.");
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

const needRes = await fetch(`${url}/rest/v1/rpc/listings_needing_embedding`, {
  method: "POST",
  headers,
  body: "{}",
});
if (!needRes.ok) {
  throw new Error(`listings_needing_embedding ${needRes.status}`);
}
const missing = await needRes.json();
if (!Array.isArray(missing) || missing.length === 0) {
  console.log("No listings need embeddings.");
  process.exit(0);
}

function listingText(row) {
  return [
    `${String(row.kind).replaceAll("_", " ")} listing.`,
    row.name,
    row.tagline,
    row.description,
  ]
    .filter(Boolean)
    .join(" ");
}

const voyageRes = await fetch("https://api.voyageai.com/v1/embeddings", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${voyage}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    input: missing.map(listingText),
    model: "voyage-4-lite",
    input_type: "document",
    output_dimension: 1024,
  }),
});
if (!voyageRes.ok) {
  throw new Error(`voyage_${voyageRes.status}`);
}
const voyageJson = await voyageRes.json();
const rows = [...(voyageJson.data ?? [])].sort(
  (a, b) => (a.index ?? 0) - (b.index ?? 0),
);

let stored = 0;
for (const [index, listing] of missing.entries()) {
  const embedding = rows[index]?.embedding;
  if (!embedding) continue;
  const setRes = await fetch(`${url}/rest/v1/rpc/set_listing_embedding`, {
    method: "POST",
    headers,
    body: JSON.stringify({ p_id: listing.id, p_embedding: embedding }),
  });
  if (!setRes.ok) {
    console.error(`embed failed ${listing.id} ${setRes.status}`);
    continue;
  }
  stored += 1;
}

console.log(`Embedded ${stored} of ${missing.length} listings.`);
