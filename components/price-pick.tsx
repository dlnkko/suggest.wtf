"use client";

import { LISTING_PRICE_OPTIONS } from "@/lib/constants";

export function PricePick({
  value,
  onChange,
}: {
  value: number;
  onChange: (amount: number) => void;
}) {
  return (
    <div className="price-grid" role="group" aria-label="Credits in USD">
      {LISTING_PRICE_OPTIONS.map((price) => {
        const selected = value === price;
        return (
          <button
            key={price}
            type="button"
            aria-pressed={selected}
            className={`price-btn${selected ? " is-selected" : ""}`}
            onClick={() => onChange(price)}
          >
            ${price.toLocaleString("en")}
          </button>
        );
      })}
    </div>
  );
}
