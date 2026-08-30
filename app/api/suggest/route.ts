import { scrapeLanding } from "@/lib/firecrawl";
import { getCatalog, getSignedInUserId } from "@/lib/listings";
import { matchListings } from "@/lib/match";
import { normalizeUrl } from "@/lib/url";

export const maxDuration = 60;

export async function POST(request: Request) {
  const userId = await getSignedInUserId();
  if (!userId) {
    return Response.json({ error: "Sign in with Google first." }, { status: 401 });
  }

  let body: { url?: unknown };
  try {
    body = (await request.json()) as { url?: unknown };
  } catch {
    return Response.json({ error: "Send a URL to analyze." }, { status: 400 });
  }

  const url = typeof body.url === "string" ? normalizeUrl(body.url) : null;
  if (!url) {
    return Response.json(
      { error: "Paste a URL only (https://your-site.com)." },
      { status: 400 },
    );
  }

  try {
    const scraped = await scrapeLanding(url);
    let listings: Awaited<ReturnType<typeof getCatalog>> = [];
    try {
      listings = await getCatalog();
    } catch (catalogError) {
      console.error("catalog_failed", catalogError);
    }

    try {
      const matched = await matchListings({
        url,
        title: scraped.title,
        markdown: scraped.markdown,
        listings,
      });

      return Response.json({
        url,
        site: matched.site,
        matches: matched.matches,
      });
    } catch (matchError) {
      console.error("match_failed", matchError);
      return Response.json({
        url,
        site: {
          title: scraped.title || url,
          what_it_is: scraped.markdown.split("\n").find((line) => line.trim()) || url,
          needs: [],
          facts: [],
        },
        matches: [],
      });
    }
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "missing_firecrawl_key") {
      return Response.json(
        { error: "FIRECRAWL_API_KEY is missing in .env.local." },
        { status: 500 },
      );
    }
    if (code === "missing_openai_key") {
      return Response.json(
        { error: "OPENAI_API_KEY is missing in .env.local." },
        { status: 500 },
      );
    }
    if (code === "empty_scrape") {
      return Response.json(
        { error: "We couldn’t read that site. Try another public URL." },
        { status: 422 },
      );
    }

    console.error(error);
    return Response.json(
      { error: "We couldn’t analyze that site. Try again." },
      { status: 500 },
    );
  }
}
