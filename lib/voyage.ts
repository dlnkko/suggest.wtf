import { VOYAGE_DIMENSIONS, VOYAGE_MODEL } from "./constants";

type VoyageResponse = {
  data?: Array<{ embedding?: number[]; index?: number }>;
};

export async function embedTexts(
  texts: string[],
  inputType: "query" | "document",
): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    throw new Error("missing_voyage_key");
  }

  const cleaned = texts.map((text) => text.trim()).filter(Boolean);
  if (cleaned.length === 0) {
    return [];
  }

  const response = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: cleaned,
      model: VOYAGE_MODEL,
      input_type: inputType,
      output_dimension: VOYAGE_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    throw new Error(`voyage_${response.status}`);
  }

  const payload = (await response.json()) as VoyageResponse;
  const rows = [...(payload.data ?? [])].sort(
    (a, b) => (a.index ?? 0) - (b.index ?? 0),
  );

  return rows.map((row) => {
    const embedding = row.embedding ?? [];
    if (embedding.length !== VOYAGE_DIMENSIONS) {
      throw new Error("voyage_bad_dimensions");
    }
    return embedding;
  });
}

export function listingEmbedText(input: {
  name: string;
  kind: string;
  tagline: string;
  description: string;
}): string {
  return [
    `${input.kind.replaceAll("_", " ")} listing.`,
    input.name,
    input.tagline,
    input.description,
  ]
    .filter(Boolean)
    .join(" ");
}
