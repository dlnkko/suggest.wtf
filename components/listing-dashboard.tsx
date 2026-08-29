"use client";

import { Button } from "@/components/button";
import {
  CLICK_COST_USD,
  KIND_LABELS,
  MAX_LISTING_USD,
  MIN_LISTING_USD,
  clicksFromUsd,
  parseListingAmount,
} from "@/lib/constants";
import { displayHost } from "@/lib/url";
import type { ListingClick, ListingDashboard } from "@/lib/types";
import { useState } from "react";
import { signOut, topUpCredits } from "@/app/list/actions";

const ERRORS: Record<string, string> = {
  failed: "We couldn’t add those credits. Try again.",
  amount: `Spend at least $${MIN_LISTING_USD}, up to $${MAX_LISTING_USD.toLocaleString("en")}.`,
};

export function ListingDashboard({
  listing,
  clicks,
  notice,
  errorCode,
}: {
  listing: ListingDashboard;
  clicks: ListingClick[];
  notice?: "paid" | "topup";
  errorCode?: string;
}) {
  const error = errorCode ? ERRORS[errorCode] : null;

  return (
    <div>
      {notice === "paid" ? (
        <p className="rise text-sm text-[var(--muted)]">You’re live in the catalog.</p>
      ) : null}
      {notice === "topup" ? (
        <p className="rise text-sm text-[var(--muted)]">Credits added.</p>
      ) : null}

      <div className="rise" style={notice ? { animationDelay: "80ms" } : undefined}>
        <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
          {KIND_LABELS[listing.kind]} · {displayHost(listing.url)}
        </p>
        <h1 className="display mt-3 text-[2.6rem] leading-tight sm:text-5xl">
          {listing.name}
        </h1>
        <p className="mt-4 text-[15px] leading-7 text-[var(--muted)]">{listing.tagline}</p>
        <p className="mt-3 text-[15px] leading-7 text-[var(--muted)]">{listing.description}</p>
        <p className="mt-4 text-sm text-[var(--muted)]">
          This listing is locked. You can add credits, not edit the copy.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat
          label="Credits"
          value={`$${Number(listing.credit_balance_usd).toFixed(2)}`}
          delay="120ms"
        />
        <Stat label="Clicks left" value={String(listing.clicks_remaining)} delay="180ms" />
        <Stat label="Clicks so far" value={String(listing.clicks_charged)} delay="220ms" />
      </div>

      <p className="rise mt-6 text-sm text-[var(--muted)]" style={{ animationDelay: "240ms" }}>
        Status: {statusLabel(listing.status)}. Each visit costs ${CLICK_COST_USD.toFixed(2)}.
      </p>

      <section className="rise mt-12" style={{ animationDelay: "280ms" }}>
        <h2 className="text-sm font-medium tracking-tight">Add credits</h2>
        <CreditsForm error={error} />
      </section>

      <section className="rise mt-14" style={{ animationDelay: "320ms" }}>
        <h2 className="text-sm font-medium tracking-tight">Recent clicks</h2>
        {clicks.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">No visits yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--line)] border-t border-[var(--line)]">
            {clicks.map((click) => (
              <li
                key={click.id}
                className="flex items-center justify-between gap-4 py-3.5 text-sm"
              >
                <span className="text-[var(--muted)]">
                  {new Date(click.created_at).toLocaleString("en")}
                </span>
                <span className="tabular-nums">
                  {click.charged ? `-$${Number(click.amount_usd).toFixed(2)}` : "not charged"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={signOut} className="rise mt-14" style={{ animationDelay: "360ms" }}>
        <Button type="submit" variant="ghost" className="px-0 py-2 text-sm">
          Sign out
        </Button>
      </form>
    </div>
  );
}

function CreditsForm({ error }: { error: string | null }) {
  const [amount, setAmount] = useState(String(MIN_LISTING_USD));
  const parsed = parseListingAmount(amount);
  const clicks = parsed ? clicksFromUsd(parsed) : 0;

  return (
    <form action={topUpCredits} className="mt-5 flex flex-col gap-4">
      {error ? <p className="text-sm text-[#9a3412]">{error}</p> : null}
      <label className="flex flex-col gap-2">
        <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
          Amount in USD
        </span>
        <input
          name="amount"
          type="number"
          required
          min={MIN_LISTING_USD}
          max={MAX_LISTING_USD}
          step="1"
          inputMode="numeric"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="field-input tabular-nums"
        />
      </label>
      <p className="text-sm leading-6 text-[var(--muted)]">
        {parsed ? (
          <>
            +{clicks.toLocaleString("en")} clicks for ${parsed.toLocaleString("en")}.
            Minimum ${MIN_LISTING_USD}.
          </>
        ) : (
          <>Minimum is ${MIN_LISTING_USD}. Nothing below that is accepted.</>
        )}
      </p>
      <Button
        type="submit"
        className="w-full rounded-2xl px-5 py-4 text-sm sm:w-auto"
        disabled={!parsed}
      >
        Add ${parsed ? parsed.toLocaleString("en") : MIN_LISTING_USD}
      </Button>
    </form>
  );
}

function Stat({
  label,
  value,
  delay,
}: {
  label: string;
  value: string;
  delay: string;
}) {
  return (
    <div className="card rise rounded-[1.35rem] p-5" style={{ animationDelay: delay }}>
      <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
      <p className="display mt-3 text-3xl tracking-tight sm:text-4xl">{value}</p>
    </div>
  );
}

function statusLabel(status: string): string {
  if (status === "active") return "active";
  if (status === "pending") return "awaiting payment";
  if (status === "depleted") return "out of credits";
  if (status === "paused") return "paused";
  return status;
}
