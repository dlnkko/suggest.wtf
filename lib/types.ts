import type { ListingKind } from "./constants";

export type ListingProfile = {
  sells: string;
  serves: string;
  helps_with: string[];
  proof: string[];
  avoid: string[];
};

export type CatalogListing = {
  id: number;
  name: string;
  kind: ListingKind;
  url: string;
  tagline: string;
  description: string;
  profile: ListingProfile | null;
  house: boolean;
};

export type SiteBrief = {
  title: string;
  what_it_is: string;
  needs: string[];
  facts: string[];
};

export type SuggestionMatch = {
  id: number;
  name: string;
  kind: ListingKind;
  url: string;
  tagline: string;
  reason: string;
  house: boolean;
};

export type SuggestResponse = {
  url: string;
  site: SiteBrief;
  matches: SuggestionMatch[];
  catalog_revision: string;
  catalog_count: number;
};

export type ListingDashboard = {
  id: number;
  name: string;
  kind: ListingKind;
  url: string;
  tagline: string;
  description: string;
  credit_balance_usd: number;
  pending_amount: number | null;
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
  visitor_email: string | null;
};
