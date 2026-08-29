"use client";

import { Button } from "@/components/button";
import { KindSelect } from "@/components/kind-select";
import {
  CLICK_COST_USD,
  MAX_LISTING_USD,
  MIN_LISTING_USD,
  clicksFromUsd,
  parseListingAmount,
} from "@/lib/constants";
import type { ReactNode } from "react";
import { useState } from "react";
import { createListing } from "@/app/list/actions";

const ERRORS: Record<string, string> = {
  incomplete: "Fill every field with a real URL.",
  failed: "We couldn’t publish that. Check the details and try again.",
  amount: `Spend at least $${MIN_LISTING_USD}, up to $${MAX_LISTING_USD.toLocaleString("en")}.`,
  auth: "Sign in with Google first.",
};

export function ListingForm({ errorCode }: { errorCode?: string }) {
  const [amount, setAmount] = useState(String(MIN_LISTING_USD));
  const parsed = parseListingAmount(amount);
  const clicks = parsed ? clicksFromUsd(parsed) : 0;
  const error = errorCode ? ERRORS[errorCode] : null;

  return (
    <form action={createListing} className="flex flex-col gap-5">
      {error ? <p className="text-sm text-[#9a3412]">{error}</p> : null}

      <Field label="What you are" htmlFor="kind">
        <KindSelect name="kind" />
      </Field>

      <Field label="Your URL" htmlFor="url">
        <input
          id="url"
          name="url"
          type="url"
          required
          placeholder="https://your-site.com"
          className="field-input font-mono"
        />
      </Field>

      <Field label="One line" htmlFor="tagline">
        <input
          id="tagline"
          name="tagline"
          required
          minLength={4}
          placeholder="What you do, for whom"
          className="field-input"
        />
      </Field>

      <Field label="Description" htmlFor="description">
        <textarea
          id="description"
          name="description"
          required
          minLength={12}
          rows={4}
          placeholder="Who you help, and when they should pick you."
          className="field-input resize-y"
        />
      </Field>

      <Field label="Credits in USD" htmlFor="amount">
        <input
          id="amount"
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
      </Field>

      <p className="text-sm leading-6 text-[var(--muted)]">
        {parsed ? (
          <>
            ${parsed.toLocaleString("en")} becomes {clicks.toLocaleString("en")}{" "}
            clicks. Each visit costs ${CLICK_COST_USD.toFixed(2)}.
          </>
        ) : (
          <>Minimum is ${MIN_LISTING_USD}. Nothing below that is accepted.</>
        )}
      </p>

      <Button
        type="submit"
        className="mt-1 w-full rounded-2xl px-5 py-4 text-sm"
        disabled={!parsed}
      >
        Pay ${parsed ? parsed.toLocaleString("en") : MIN_LISTING_USD} and get listed
      </Button>

      <p className="text-sm leading-6 text-[var(--muted)]">
        After you save, the listing is locked. You can add more credits later.
      </p>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
