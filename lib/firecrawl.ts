import { Firecrawl } from "firecrawl";
import { MARKDOWN_CHAR_LIMIT } from "./constants";
import { displayHost } from "./url";

type ScrapeDoc = {
  markdown?: string | null;
  summary?: string | null;
  metadata?: {
    title?: string | null;
    description?: string | null;
    ogTitle?: string | null;
    ogDescription?: string | null;
  } | null;
};

const ATTEMPTS: Array<Record<string, unknown>> = [
  { formats: ["markdown"], onlyMainContent: true, timeout: 20000 },
  {
    formats: ["markdown"],
    onlyMainContent: false,
    proxy: "auto",
    timeout: 35000,
    waitFor: 1500,
  },
];

export async function scrapeLanding(url: string): Promise<{
  markdown: string;
  title: string | null;
}> {
  const apiKey = process.env.FIRECRAWL_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("missing_firecrawl_key");
  }

  const app = new Firecrawl({ apiKey });

  for (const options of ATTEMPTS) {
    try {
      const doc = (await app.scrape(url, options)) as ScrapeDoc;
      const parsed = fromDoc(doc, url);
      if (parsed) return parsed;
    } catch (error) {
      console.error("scrape_attempt_failed", url, error);
    }
  }

  return fallbackFromUrl(url);
}

function fromDoc(
  doc: ScrapeDoc,
  url: string,
): { markdown: string; title: string | null } | null {
  const title =
    doc.metadata?.title?.trim() ||
    doc.metadata?.ogTitle?.trim() ||
    null;
  const extra = [doc.metadata?.description, doc.metadata?.ogDescription, doc.summary]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean)
    .join("\n\n");
  const markdown = [doc.markdown?.trim() ?? "", extra].filter(Boolean).join("\n\n");

  if (!markdown && !title) return null;

  return {
    markdown: (markdown || `# ${title || displayHost(url)}`).slice(0, MARKDOWN_CHAR_LIMIT),
    title,
  };
}

function fallbackFromUrl(url: string): { markdown: string; title: string | null } {
  const host = displayHost(url);
  return {
    markdown: `# ${host}\n\n${url}\n\nPublic site at ${host}.`,
    title: host,
  };
}
