export const MIN_LISTING_USD = 20;
export const MAX_LISTING_USD = 10000;
export const LISTING_PRICE_USD = MIN_LISTING_USD;
export const CLICK_COST_USD = 0.25;
export const CLICKS_PER_LISTING = LISTING_PRICE_USD / CLICK_COST_USD;
export const MARKDOWN_CHAR_LIMIT = 8000;
export const BRIEF_CHAR_LIMIT = 3200;
export const MATCH_LIMIT = 5;
export const CANDIDATE_LIMIT = 12;
export const VOYAGE_MODEL = "voyage-4-lite";
export const VOYAGE_DIMENSIONS = 1024;

export const KIND_LABELS = {
  startup: "Startup",
  consumer_app: "Consumer app",
  freelancer: "Freelancer",
  content_creator: "Content creator",
  agency: "Agency",
} as const;

export type ListingKind = keyof typeof KIND_LABELS;

export const LISTING_KINDS = Object.keys(KIND_LABELS) as ListingKind[];

export function isListingKind(value: unknown): value is ListingKind {
  return typeof value === "string" && value in KIND_LABELS;
}

export function parseListingAmount(value: unknown): number | null {
  const raw = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(raw)) return null;
  const amount = Math.round(raw * 100) / 100;
  if (amount < MIN_LISTING_USD || amount > MAX_LISTING_USD) return null;
  return amount;
}

export function clicksFromUsd(amount: number): number {
  if (!Number.isFinite(amount) || amount < MIN_LISTING_USD) return 0;
  return Math.floor(amount / CLICK_COST_USD);
}
