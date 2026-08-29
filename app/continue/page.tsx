import { GoogleSignIn } from "@/components/google-sign-in";
import { getSignedInUserId } from "@/lib/listings";
import { normalizeUrl } from "@/lib/url";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ContinuePage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; error?: string }>;
}) {
  const { url: rawUrl, error } = await searchParams;
  const url = typeof rawUrl === "string" ? normalizeUrl(rawUrl) : null;
  if (!url) {
    redirect("/");
  }

  const userId = await getSignedInUserId();
  if (userId) {
    redirect(`/suggest?url=${encodeURIComponent(url)}`);
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6 py-16 sm:px-10 sm:py-20">
      <div className="rise flex-1">
        <h1 className="headline-page">
          Find the perfect leverage.
        </h1>
        <GoogleSignIn
          errorCode={error}
          next={`/suggest?url=${encodeURIComponent(url)}`}
        />
      </div>
    </main>
  );
}
