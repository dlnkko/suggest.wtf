"use server";

import {
  checkoutUrlForAmount,
  isListingKind,
  parseListingAmount,
  type ListingKind,
} from "@/lib/constants";
import { addListingCredits, getSignedInUserId, publishListing } from "@/lib/listings";
import { createClient } from "@/lib/supabase/server";
import { displayHost, normalizeUrl } from "@/lib/url";
import { redirect } from "next/navigation";

function asKind(value: FormDataEntryValue | null): ListingKind | null {
  return isListingKind(value) ? value : null;
}

function read(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createListing(formData: FormData) {
  const userId = await getSignedInUserId();
  if (!userId) {
    redirect("/list?error=auth");
  }

  const kind = asKind(formData.get("kind"));
  const url = normalizeUrl(read(formData, "url"));
  const tagline = read(formData, "tagline");
  const description = read(formData, "description");
  const amount = parseListingAmount(read(formData, "amount"));

  if (!kind || !url || !tagline || !description) {
    redirect("/list?error=incomplete");
  }

  if (amount === null) {
    redirect("/list?error=amount");
  }

  try {
    await publishListing({
      name: displayHost(url),
      kind,
      url,
      tagline,
      description,
      amount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("already have a listing")) {
      redirect("/dashboard");
    }
    redirect("/list?error=failed");
  }

  redirectToCheckout(amount);
}

export async function topUpCredits(formData: FormData) {
  const userId = await getSignedInUserId();
  if (!userId) {
    redirect("/dashboard?error=auth");
  }

  const amount = parseListingAmount(read(formData, "amount"));
  if (amount === null) {
    redirect("/dashboard?error=amount");
  }

  try {
    await addListingCredits(amount);
  } catch {
    redirect("/dashboard?error=failed");
  }

  redirectToCheckout(amount);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

function redirectToCheckout(amount: number): never {
  const checkout = checkoutUrlForAmount(amount);
  if (!checkout) {
    redirect("/dashboard?error=checkout");
  }
  redirect(checkout);
}
