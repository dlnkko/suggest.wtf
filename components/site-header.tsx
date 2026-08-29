import { Button } from "@/components/button";
import { getMyDashboard, getSignedInUserId } from "@/lib/listings";
import Link from "next/link";

export async function SiteHeader() {
  const userId = await getSignedInUserId();
  let listed = false;
  if (userId) {
    try {
      listed = Boolean(await getMyDashboard());
    } catch {
      listed = false;
    }
  }

  return (
    <header className="relative z-20 flex items-center justify-between gap-6 px-6 py-5 sm:px-10">
      <Link
        href="/"
        className="btn btn-ghost -ml-2 rounded-full px-2 py-1.5 text-[15px] tracking-tight"
      >
        <span className="flex items-center gap-2.5">
          <img
            src="/mark.png"
            alt=""
            width={22}
            height={22}
            className="h-[22px] w-[22px] shrink-0"
          />
          suggest.wtf
        </span>
      </Link>
      <Button href="/list" variant="pill" className="px-5 py-2.5 text-[15px]">
        {listed ? "Dashboard" : "Get listed"}
      </Button>
    </header>
  );
}
