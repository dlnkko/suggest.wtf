export const MIN_LISTING_USD = 20;
export const MAX_LISTING_USD = 10000;
export const LISTING_PRICE_OPTIONS = [20, 50, 100, 300, 500, 1000] as const;
export type ListingPriceOption = (typeof LISTING_PRICE_OPTIONS)[number];
export const LISTING_PRICE_USD = MIN_LISTING_USD;
export const CLICK_COST_USD = 0.5;
export const CLICKS_PER_LISTING = LISTING_PRICE_USD / CLICK_COST_USD;
export const MARKDOWN_CHAR_LIMIT = 8000;
export const BRIEF_CHAR_LIMIT = 3200;
export const MATCH_LIMIT = 3;
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
  if (!(LISTING_PRICE_OPTIONS as readonly number[]).includes(amount)) return null;
  return amount;
}

const CHECKOUT_BY_AMOUNT: Record<ListingPriceOption, string> = {
  20: "https://whop.com/checkout/plan_qPDRCdOk5RxhS",
  50: "https://whop.com/checkout/plan_V5WafiBtSboat",
  100: "https://whop.com/checkout/plan_ocp5Xf6DRw1dY",
  300: "https://whop.com/checkout/plan_cxQZ4J92GlTme",
  500: "https://whop.com/checkout/plan_GmUJWtYMShr73",
  1000: "https://whop.com/checkout/plan_10NB6pJb9cDhO",
};

function checkoutUrlsByAmount(): Record<ListingPriceOption, string | undefined> {
  return {
    20: process.env.NEXT_PUBLIC_CHECKOUT_20 || CHECKOUT_BY_AMOUNT[20],
    50: process.env.NEXT_PUBLIC_CHECKOUT_50 || CHECKOUT_BY_AMOUNT[50],
    100: process.env.NEXT_PUBLIC_CHECKOUT_100 || CHECKOUT_BY_AMOUNT[100],
    300: process.env.NEXT_PUBLIC_CHECKOUT_300 || CHECKOUT_BY_AMOUNT[300],
    500: process.env.NEXT_PUBLIC_CHECKOUT_500 || CHECKOUT_BY_AMOUNT[500],
    1000: process.env.NEXT_PUBLIC_CHECKOUT_1000 || CHECKOUT_BY_AMOUNT[1000],
  };
}

export function checkoutUrlForAmount(amount: number): string | null {
  const fromEnv = checkoutUrlsByAmount();
  const exact = (LISTING_PRICE_OPTIONS as readonly number[]).includes(amount)
    ? fromEnv[amount as ListingPriceOption]
    : undefined;
  const fallback = process.env.NEXT_PUBLIC_CHECKOUT_URL;
  const url = exact || fallback;
  return url && url.length > 0 ? url : null;
}

export function amountFromWhopPlanId(planId: string | null | undefined): number | null {
  if (!planId) return null;
  for (const [amount, url] of Object.entries(checkoutUrlsByAmount())) {
    if (url && url.includes(planId)) {
      return Number(amount);
    }
  }
  return null;
}

export function clicksFromUsd(amount: number): number {
  if (!Number.isFinite(amount) || amount < MIN_LISTING_USD) return 0;
  return Math.floor(amount / CLICK_COST_USD);
}
