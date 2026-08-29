"use client";

import { KIND_LABELS, LISTING_KINDS, type ListingKind } from "@/lib/constants";
import { useEffect, useId, useRef, useState } from "react";

export function KindSelect({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<ListingKind | "">("");
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function pick(kind: ListingKind) {
    setValue(kind);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="kind-select">
      <input type="hidden" name={name} value={value} required />
      <button
        id={name}
        type="button"
        className="kind-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={value ? "text-[var(--foreground)]" : "text-[var(--muted)]"}>
          {value ? KIND_LABELS[value] : "Select one"}
        </span>
        <svg
          className={`kind-chevron ${open ? "is-open" : ""}`}
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 5.25 7 9.25 11 5.25"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open ? (
        <ul id={listId} role="listbox" className="kind-menu">
          {LISTING_KINDS.map((kind) => {
            const selected = kind === value;
            return (
              <li key={kind} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={`kind-option ${selected ? "is-selected" : ""}`}
                  onClick={() => pick(kind)}
                >
                  {KIND_LABELS[kind]}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
