export const PRODUCTION_ORIGIN = "https://suggest.wtf";

export function isLocalHost(value: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(value);
}

export function publicSiteOrigin(): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  if (site.startsWith("https://") && !isLocalHost(site)) {
    return site;
  }
  return PRODUCTION_ORIGIN;
}

export function oauthAppOrigin(): string {
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return window.location.origin;
  }
  return publicSiteOrigin();
}
