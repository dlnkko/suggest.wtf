import { HeroHeadline } from "@/components/hero-headline";
import { UrlSuggest } from "@/components/url-suggest";
import { getSignedInUserId } from "@/lib/listings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const signedIn = Boolean(await getSignedInUserId());

  return (
    <main className="flex flex-1 flex-col px-6 pb-28 pt-20 sm:px-10 sm:pt-28">
      <div className="rise mx-auto w-full max-w-5xl text-center">
        <HeroHeadline />
      </div>
      <div className="rise mt-10 sm:mt-12" style={{ animationDelay: "90ms" }}>
        <UrlSuggest signedIn={signedIn} />
      </div>
    </main>
  );
}
