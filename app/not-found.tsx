import { Button } from "@/components/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 pb-28 text-center">
      <div className="rise">
        <h1 className="display text-4xl sm:text-5xl">Nothing here.</h1>
        <p className="mt-4 text-sm text-[var(--muted)]">
          That listing doesn’t exist, or the link is wrong.
        </p>
        <Button href="/" variant="pill" className="mt-8 px-5 py-2.5 text-sm">
          Back
        </Button>
      </div>
    </main>
  );
}
