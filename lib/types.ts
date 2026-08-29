import type { ListingKind } from "./constants";

export type CatalogListing = {
  id: number;
  name: string;
  kind: ListingKind;
  url: string;
  tagline: string;
  description: string;
};

export type SiteBrief = {
  title: string;
  what_it_is: string;
  needs: string[];
};

export type SuggestionMatch = {
  id: number;
  name: string;
  kind: ListingKind;
  url: string;
  tagline: string;
  reason: string;
};

export type SuggestResponse = {
  url: string;
  site: SiteBrief;
  matches: SuggestionMatch[];
};

export type ListingDashboard = {
  id: number;
  name: string;
  kind: ListingKind;
  url: string;
  tagline: string;
  description: string;
  credit_balance_usd: number;
  status: "pending" | "active" | "paused" | "depleted";
  clicks_remaining: number;
  clicks_charged: number;
  clicks_total: number;
  created_at: string;
};

export type ListingClick = {
  id: number;
  created_at: string;
  source_url: string | null;
  amount_usd: number;
  charged: boolean;
};
