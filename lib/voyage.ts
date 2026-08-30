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

  const body = JSON.stringify({
    input: cleaned,
    model: VOYAGE_MODEL,
    input_type: inputType,
    output_dimension: VOYAGE_DIMENSIONS,
  });

  let response = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body,
  });

  for (let attempt = 0; attempt < 2 && response.status === 429; attempt += 1) {
    await sleep(retryWaitMs(response));
    response = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body,
    });
  }

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

function retryWaitMs(response: Response): number {
  const raw = response.headers.get("retry-after");
  const seconds = raw ? Number(raw) : NaN;
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.min(Math.ceil(seconds * 1000), 8000);
  }
  return 1500;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

export function offerEmbedText(input: {
  name: string;
  kind: string;
  tagline: string;
  description: string;
  profile: { sells: string; serves: string };
}): string {
  return [
    `${input.kind.replaceAll("_", " ")} listing.`,
    input.name,
    input.profile.sells,
    input.profile.serves,
    input.tagline,
    input.description,
  ]
    .filter(Boolean)
    .join(" ");
}

export function helpsEmbedText(input: {
  name: string;
  kind: string;
  tagline: string;
  profile: { serves: string; helps_with: string[]; proof: string[] };
}): string {
  return [
    `${input.name} helps other companies with ${input.profile.helps_with.join(", ")}.`,
    input.profile.serves ? `Best for ${input.profile.serves}.` : "",
    input.tagline,
    ...input.profile.proof.slice(0, 3),
  ]
    .filter(Boolean)
    .join(" ");
}
