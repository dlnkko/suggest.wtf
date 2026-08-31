import { redirect } from "next/navigation";
import { GoogleSignIn } from "@/components/google-sign-in";
import { ListingForm } from "@/components/listing-form";
import { getMyDashboard, getSignedInUserId } from "@/lib/listings";

export const dynamic = "force-dynamic";

export default async function ListPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; paid?: string }>;
}) {
  const { error, paid } = await searchParams;
  if (paid === "1") {
    redirect("/dashboard");
  }

  const userId = await getSignedInUserId();

  if (!userId) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6 py-16 sm:px-10 sm:py-20">
        <div className="rise flex-1">
          <h1 className="headline-page">
            Show up when someone pastes a URL.
          </h1>
          <GoogleSignIn errorCode={error} next="/list" />
        </div>
      </main>
    );
  }

  const dashboard = await getMyDashboard();

  if (dashboard) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6 py-16 sm:px-10 sm:py-20">
      <div className="rise flex-1">
        <h1 className="headline-page">
          Show up when someone pastes a URL.
        </h1>
        <p className="mt-5 max-w-md text-[15px] leading-7 text-[var(--muted)]">
          Each click takes $0.50 from your credits. You can’t edit after you
          save.
        </p>
        <div className="mt-10 max-w-xl">
          <ListingForm errorCode={error} />
        </div>
      </div>
    </main>
  );
}
