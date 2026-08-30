export function stripProcessTalk(text: string): string {
  const cleaned = text
    .replace(/\bthe scrape shows(?: that)?\s*/gi, "")
    .replace(/\bscrape shows(?: that)?\s*/gi, "")
    .replace(/\bbased on the scrape,?\s*/gi, "")
    .replace(/\bfrom the scrape,?\s*/gi, "on their page, ")
    .replace(/\bthis scrape\b/gi, "their page")
    .replace(/\bthe scraped (?:landing page|page|site)\b/gi, "their page")
    .replace(/\bscraped (?:landing page|page|site)\b/gi, "their page")
    .replace(/\bthe scrape\b/gi, "their page")
    .replace(/\bscrape\b/gi, "page")
    .replace(/\s{2,}/g, " ")
    .replace(/^[,.\s]+/, "")
    .trim();

  if (!cleaned) return "";
  return cleaned.replace(/^\w/, (letter) => letter.toUpperCase());
}
