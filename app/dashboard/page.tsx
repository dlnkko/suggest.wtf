import { GoogleSignIn } from "@/components/google-sign-in";
import { ListingDashboard } from "@/components/listing-dashboard";
import { getMyDashboard, getSignedInUserId } from "@/lib/listings";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const userId = await getSignedInUserId();

  if (!userId) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6 py-16 sm:px-10 sm:py-20">
        <div className="rise flex-1">
          <h1 className="headline-page">Opening your dashboard.</h1>
          <p className="mt-4 max-w-md text-[15px] leading-7 text-[var(--muted)]">
            Sign in with the same Google account you used to list.
          </p>
          <GoogleSignIn errorCode={error} next="/dashboard" autoStart />
        </div>
      </main>
    );
  }

  const dashboard = await getMyDashboard();

  if (dashboard) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16 sm:px-10 sm:py-20">
        <ListingDashboard
          listing={dashboard.listing}
          clicks={dashboard.clicks}
          errorCode={error}
        />
      </main>
    );
  }

  redirect("/list");
}
