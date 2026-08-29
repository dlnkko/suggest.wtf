import { SuggestRun } from "@/components/suggest-run";
import { getSignedInUserId } from "@/lib/listings";
import { normalizeUrl } from "@/lib/url";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SuggestPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const { url: rawUrl } = await searchParams;
  const url = typeof rawUrl === "string" ? normalizeUrl(rawUrl) : null;
  if (!url) {
    redirect("/");
  }

  const userId = await getSignedInUserId();
  if (!userId) {
    redirect(`/continue?url=${encodeURIComponent(url)}`);
  }

  return (
    <main className="flex flex-1 flex-col px-6 pb-28 pt-16 sm:px-10 sm:pt-20">
      <SuggestRun url={url} />
    </main>
  );
}
