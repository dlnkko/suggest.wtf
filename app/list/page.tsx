import { GoogleSignIn } from "@/components/google-sign-in";
import { ListingDashboard } from "@/components/listing-dashboard";
import { ListingForm } from "@/components/listing-form";
import { CLICK_COST_USD, MAX_LISTING_USD, MIN_LISTING_USD } from "@/lib/constants";
import { getMyDashboard, getSignedInUserId } from "@/lib/listings";

export const dynamic = "force-dynamic";

export default async function ListPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; paid?: string; topup?: string }>;
}) {
  const { error, paid, topup } = await searchParams;
  const userId = await getSignedInUserId();

  if (!userId) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6 py-16 sm:px-10 sm:py-20">
        <div className="rise flex-1">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
            Catalog
          </p>
          <h1 className="display mt-4 text-[2.6rem] leading-[1.08] sm:text-5xl">
            Show up when someone pastes a URL.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-7 text-[var(--muted)]">
            {`Sign in, write your listing once, and put $${MIN_LISTING_USD}–$${MAX_LISTING_USD.toLocaleString("en")} behind it. Each visit costs $${CLICK_COST_USD.toFixed(2)}.`}
          </p>
          <GoogleSignIn errorCode={error} />
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
          notice={paid ? "paid" : topup ? "topup" : undefined}
          errorCode={error}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6 py-16 sm:px-10 sm:py-20">
      <div className="rise flex-1">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
          Catalog
        </p>
        <h1 className="display mt-4 text-[2.6rem] leading-[1.08] sm:text-5xl">
          Show up when someone pastes a URL.
        </h1>
        <p className="mt-5 max-w-md text-[15px] leading-7 text-[var(--muted)]">
          {`Pick how much to put in, from $${MIN_LISTING_USD} to $${MAX_LISTING_USD.toLocaleString("en")}. Clicks are calculated at $${CLICK_COST_USD.toFixed(2)} each. After you save, you can’t edit the listing.`}
        </p>
        <div className="mt-10 max-w-xl">
          <ListingForm errorCode={error} />
        </div>
      </div>
    </main>
  );
}
