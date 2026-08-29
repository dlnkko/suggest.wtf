import OpenAI from "openai";

export function extractOutputText(response: unknown): string {
  if (
    response &&
    typeof response === "object" &&
    "output_text" in response &&
    typeof response.output_text === "string"
  ) {
    return response.output_text;
  }

  const output = (response as { output?: Array<{ content?: Array<{ text?: string }> }> })
    .output;
  const pieces =
    output?.flatMap((item) => item.content?.map((part) => part.text ?? "") ?? []) ?? [];
  return pieces.join("\n").trim();
}

export function parseJsonObject<T>(raw: string): T {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return JSON.parse(cleaned) as T;
}

export async function lunaJson(instructions: string, input: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("missing_openai_key");
  }

  const openai = new OpenAI({ apiKey });
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5.6-luna",
    instructions,
    input,
  });

  return extractOutputText(response);
}
