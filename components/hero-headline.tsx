"use client";

import { useEffect, useState } from "react";

const WORDS = ["startup", "app", "agency"] as const;

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
    <div>
      <h1 className="headline-title">
        Paste your{" "}
        <em key={word} className="word-swap">
          {word}
        </em>{" "}
        URL
      </h1>
      <p className="headline-sub">
        Get the right match for what you’re building.
      </p>
    </div>
  );
}
