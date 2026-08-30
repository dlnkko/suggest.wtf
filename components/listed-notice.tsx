export function ListedNotice({ compact = false }: { compact?: boolean }) {
  const Title = compact ? "p" : "h1";

  return (
    <div className="listed-notice rise">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
        Listed
      </p>
      <Title
        className={
          compact
            ? "display mt-2 text-3xl tracking-tight"
            : "headline-page mt-3"
        }
      >
        You’re live.
      </Title>
      <p className="mt-4 max-w-md text-[15px] leading-7 text-[var(--muted)]">
        You’re listed. When someone pastes a URL, you can show up for them.
      </p>
    </div>
  );
}
