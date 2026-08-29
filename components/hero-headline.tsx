"use client";

import { useEffect, useState } from "react";

const WORDS = ["startup", "app", "profile", "agency"] as const;

export function HeroHeadline() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % WORDS.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, []);

  const word = WORDS[index];

  return (
    <h1 className="display text-[2.75rem] leading-[1.08] sm:text-[3.5rem]">
      Paste your{" "}
      <em key={word} className="word-swap">
        {word}
      </em>{" "}
      URL
      <br />
      <em className="text-[var(--muted)]">
        Get the right match for what you’re building.
      </em>
    </h1>
  );
}
