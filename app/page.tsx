import { HeroHeadline } from "@/components/hero-headline";
import { UrlSuggest } from "@/components/url-suggest";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col px-6 pb-28 pt-20 sm:px-10 sm:pt-28">
      <div className="rise mx-auto w-full max-w-2xl text-center">
        <HeroHeadline />
      </div>
      <div className="rise mt-12" style={{ animationDelay: "90ms" }}>
        <UrlSuggest />
      </div>
    </main>
  );
}
