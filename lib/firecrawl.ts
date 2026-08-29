import { Firecrawl } from "firecrawl";
import { MARKDOWN_CHAR_LIMIT } from "./constants";

type ScrapeDoc = {
  markdown?: string | null;
  metadata?: { title?: string | null } | null;
};

export async function scrapeLanding(url: string): Promise<{
  markdown: string;
  title: string | null;
}> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("missing_firecrawl_key");
  }

  const app = new Firecrawl({ apiKey });
  const doc = (await app.scrape(url, {
    formats: ["markdown"],
    onlyMainContent: true,
  })) as ScrapeDoc;

  const markdown = doc.markdown?.trim() ?? "";
  if (!markdown) {
    throw new Error("empty_scrape");
  }

  return {
    markdown: markdown.slice(0, MARKDOWN_CHAR_LIMIT),
    title: doc.metadata?.title?.trim() || null,
  };
}
