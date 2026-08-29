"use client";

import { Button } from "@/components/button";
import { ListedNotice } from "@/components/listed-notice";
import { PricePick } from "@/components/price-pick";
import { MIN_LISTING_USD, clicksFromUsd } from "@/lib/constants";
import { faviconUrl } from "@/lib/url";
import type { ListingClick, ListingDashboard } from "@/lib/types";
import { useState } from "react";
import { signOut, topUpCredits } from "@/app/list/actions";

const ERRORS: Record<string, string> = {
  failed: "We couldn’t add those credits. Try again.",
  amount: "Pick $20, $50, $100, $300, $500, or $1,000.",
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
  const sameCopy = listing.tagline.trim() === listing.description.trim();

  return (
    <div>
      {notice === "paid" ? <ListedNotice compact /> : null}
      {notice === "topup" ? (
        <p className="rise text-sm text-[var(--muted)]">Credits added.</p>
      ) : null}

      <div className="rise" style={notice ? { animationDelay: "80ms" } : undefined}>
        <div className={`${notice ? "mt-5" : "mt-1"} flex items-center gap-3.5`}>
          <img
            src={faviconUrl(listing.url)}
            alt=""
            width={44}
            height={44}
            className="site-favicon"
          />
          <h1 className="headline-page">{listing.name}</h1>
        </div>
        <p className="mt-4 text-[15px] leading-7 text-[var(--muted)]">{listing.tagline}</p>
        {!sameCopy ? (
          <p className="mt-3 text-[15px] leading-7 text-[var(--muted)]">
            {listing.description}
          </p>
        ) : null}
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
        Status: {statusLabel(listing.status)}. Click counts are a maximum.
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
                <div className="min-w-0">
                  <p className="truncate tracking-tight">
                    {click.visitor_email || "Unknown"}
                  </p>
                  <p className="mt-0.5 text-[var(--muted)]">
                    {new Date(click.created_at).toLocaleString("en")}
                  </p>
                </div>
                <span className="shrink-0 tabular-nums text-[var(--muted)]">
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
  const [amount, setAmount] = useState(MIN_LISTING_USD);
  const clicks = clicksFromUsd(amount);

  return (
    <form action={topUpCredits} className="mt-5 flex flex-col gap-4">
      {error ? <p className="text-sm text-[#9a3412]">{error}</p> : null}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
          Amount in USD
        </span>
        <input type="hidden" name="amount" value={amount} />
        <PricePick value={amount} onChange={setAmount} />
      </div>
      <p className="text-sm leading-6 text-[var(--muted)]">
        ${amount.toLocaleString("en")} is a maximum of {clicks.toLocaleString("en")}{" "}
        clicks.
      </p>
      <Button type="submit" className="w-full rounded-2xl px-5 py-4 text-sm sm:w-auto">
        Add ${amount.toLocaleString("en")}
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
