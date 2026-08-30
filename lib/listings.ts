import { createHash } from "node:crypto";
import { isListingKind, isWhopPaymentId, type ListingKind } from "./constants";
import { embedAndStoreListing } from "./embeddings";
import { enrichListingProfile, parseListingProfile } from "./listing-profile";
import { createSupabaseServer } from "./supabase";
import { createClient } from "./supabase/server";
import type { CatalogListing, ListingClick, ListingDashboard } from "./types";
import {
  fulfillWhopPayment,
  isSucceededWhopPayment,
  parseWhopPayment,
  retrieveWhopPayment,
} from "./whop";

type RpcError = { message?: string } | null;

function asKind(value: string): ListingKind {
  return isListingKind(value) ? value : "freelancer";
}

export async function getCatalog(): Promise<CatalogListing[]> {
  const supabase = createSupabaseServer();
  const withProfile = await supabase
    .from("catalog")
    .select("id, name, kind, url, tagline, description, profile")
    .order("id", { ascending: true });

  const result = withProfile.error
    ? await supabase
        .from("catalog")
        .select("id, name, kind, url, tagline, description")
        .order("id", { ascending: true })
    : withProfile;

  if (result.error) {
    throw new Error(result.error.message);
  }

  return (result.data ?? []).map((row) => ({
    id: Number(row.id),
    name: String(row.name),
    kind: asKind(String(row.kind)),
    url: String(row.url),
    tagline: String(row.tagline),
    description: String(row.description),
    profile: parseListingProfile("profile" in row ? row.profile : null),
  }));
}

export function catalogRevisionOf(listings: Array<{ id: number }>): string {
  if (listings.length === 0) return "0:0";
  let maxId = 0;
  for (const listing of listings) {
    if (listing.id > maxId) maxId = listing.id;
  }
  return `${listings.length}:${maxId}`;
}

export function catalogCountOf(revision: string): number {
  const n = Number(String(revision).split(":")[0]);
  return Number.isFinite(n) ? n : 0;
}

export async function getCatalogRevision(): Promise<string> {
  const supabase = createSupabaseServer();
  const { data, error } = await supabase.from("catalog").select("id");
  if (error) {
    throw new Error(error.message);
  }
  return catalogRevisionOf(
    (data ?? []).map((row) => ({ id: Number(row.id) })),
  );
}

export async function getSignedInUserId(): Promise<string | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return null;
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  return typeof sub === "string" && sub.length > 0 ? sub : null;
}

export async function publishListing(input: {
  name: string;
  kind: ListingKind;
  url: string;
  tagline: string;
  description: string;
  amount: number;
}): Promise<{ id: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("publish_listing", {
    p_name: input.name,
    p_kind: input.kind,
    p_url: input.url,
    p_tagline: input.tagline,
    p_description: input.description,
    p_amount: input.amount,
  });

  if (error) {
    throw new Error(mapRpcError(error));
  }

  const id = Number((data as { id?: number })?.id);
  if (!id) {
    throw new Error("Could not create the listing.");
  }

  try {
    await enrichListingProfile(
      {
        id,
        name: input.name,
        kind: input.kind,
        url: input.url,
        tagline: input.tagline,
        description: input.description,
      },
      true,
    );
  } catch (error) {
    console.error("listing_profile_failed", error);
    try {
      await embedAndStoreListing(
        {
          id,
          name: input.name,
          kind: input.kind,
          tagline: input.tagline,
          description: input.description,
        },
        true,
      );
    } catch (embedError) {
      console.error("listing_embed_failed", embedError);
    }
  }

  return { id };
}

export async function claimReturnedWhopPayment(paymentId: string): Promise<void> {
  if (!isWhopPaymentId(paymentId)) return;

  const dashboard = await getMyDashboard();
  if (!dashboard) return;

  if (
    dashboard.listing.status === "active" &&
    dashboard.listing.credit_balance_usd > 0 &&
    dashboard.listing.pending_amount == null
  ) {
    return;
  }

  const retrieved = await retrieveWhopPayment(paymentId);
  if (retrieved && !isSucceededWhopPayment(retrieved)) {
    throw new Error("payment_not_succeeded");
  }

  const parsed = retrieved ? parseWhopPayment(retrieved) : null;
  const amount = parsed?.amount ?? dashboard.listing.pending_amount;
  if (amount == null) return;

  await fulfillWhopPayment({
    id: parsed?.id ?? paymentId,
    email: parsed?.email ?? (await getSignedInEmail()),
    amount,
  });
}

export async function addListingCredits(amount: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_listing_credits", {
    p_amount: amount,
  });

  if (error) {
    throw new Error(mapRpcError(error));
  }
}

export async function getMyDashboard(): Promise<{
  listing: ListingDashboard;
  clicks: ListingClick[];
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_dashboard");

  if (error) {
    throw new Error(mapRpcError(error));
  }

  const payload = data as {
    ok?: boolean;
    listing?: ListingDashboard;
    clicks?: ListingClick[];
  };

  if (!payload?.ok || !payload.listing) return null;

  return {
    listing: {
      ...payload.listing,
      kind: asKind(payload.listing.kind),
      credit_balance_usd: Number(payload.listing.credit_balance_usd),
      pending_amount:
        payload.listing.pending_amount == null
          ? null
          : Number(payload.listing.pending_amount),
      clicks_remaining: Number(payload.listing.clicks_remaining),
      clicks_charged: Number(payload.listing.clicks_charged ?? 0),
      clicks_total: Number(payload.listing.clicks_total ?? 0),
    },
    clicks: payload.clicks ?? [],
  };
}

export async function getSignedInEmail(): Promise<string | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return null;
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email;
  return typeof email === "string" && email.includes("@") ? email : null;
}

export async function consumeClick(input: {
  listingId: number;
  sourceUrl?: string | null;
  visitorHash?: string | null;
  visitorEmail?: string | null;
}): Promise<{ url: string } | null> {
  const supabase = createSupabaseServer();
  const { data, error } = await supabase.rpc("consume_listing_click", {
    p_listing_id: input.listingId,
    p_source_url: input.sourceUrl ?? null,
    p_visitor_hash: input.visitorHash ?? null,
    p_visitor_email: input.visitorEmail ?? null,
  });

  if (error) {
    throw new Error(mapRpcError(error));
  }

  const payload = data as { ok?: boolean; url?: string };
  if (!payload?.ok || !payload.url) return null;
  return { url: payload.url };
}

export function hashVisitor(ip: string | null, userAgent: string | null): string {
  return createHash("sha256")
    .update(`${ip ?? ""}|${userAgent ?? ""}`)
    .digest("hex")
    .slice(0, 32);
}

function mapRpcError(error: RpcError): string {
  const message = error?.message ?? "";
  if (message.includes("invalid_url")) return "That URL isn’t valid.";
  if (message.includes("invalid_kind")) return "Pick a valid type.";
  if (message.includes("invalid_copy")) return "Add a clearer description.";
  if (message.includes("invalid_amount")) return "Spend at least $20, up to $10,000.";
  if (message.includes("already_listed")) return "You already have a listing.";
  if (message.includes("not_authenticated")) return "Sign in with Google first.";
  if (message.includes("listing_not_found")) return "We couldn’t find that listing.";
  return message || "Something went wrong.";
}
