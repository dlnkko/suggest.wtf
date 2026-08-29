"use client";

import { Button } from "@/components/button";
import { KindSelect } from "@/components/kind-select";
import { PricePick } from "@/components/price-pick";
import {
  MIN_LISTING_USD,
  clicksFromUsd,
} from "@/lib/constants";
import type { ReactNode } from "react";
import { useState } from "react";
import { createListing } from "@/app/list/actions";

const ERRORS: Record<string, string> = {
  incomplete: "Fill every field with a real URL.",
  failed: "We couldn’t publish that. Check the details and try again.",
  amount: "Pick $20, $50, $100, $300, $500, or $1,000.",
  auth: "Sign in with Google first.",
};

export function ListingForm({ errorCode }: { errorCode?: string }) {
  const [amount, setAmount] = useState(MIN_LISTING_USD);
  const clicks = clicksFromUsd(amount);
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
        <input type="hidden" id="amount" name="amount" value={amount} />
        <PricePick value={amount} onChange={setAmount} />
      </Field>

      <p className="text-sm leading-6 text-[var(--muted)]">
        ${amount.toLocaleString("en")} is a maximum of {clicks.toLocaleString("en")}{" "}
        clicks.
      </p>

      <Button
        type="submit"
        className="mt-1 w-full rounded-2xl px-5 py-4 text-sm"
      >
        Pay ${amount.toLocaleString("en")} and get listed
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
