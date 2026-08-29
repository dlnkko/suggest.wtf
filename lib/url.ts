const TRACKING_PARAM =
  /^(utm_|utm$|gad_|gclid$|gbraid$|wbraid$|fbclid$|msclkid$|ttclid$|li_fat_id$|mc_eid$|igshid$|pscd$|ps_partner_key$|ps_xid$|gsxid$|gspk$|ref$|ref_src$|yclid$)/i;

export function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password) return null;

    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost")) return null;
    if (!host.includes(".") || host.startsWith(".") || host.endsWith(".")) {
      return null;
    }

    return canonicalUrl(url.toString());
  } catch {
    return null;
  }
}

export function canonicalUrl(raw: string): string {
  try {
    const url = new URL(raw);
    for (const key of [...url.searchParams.keys()]) {
      if (TRACKING_PARAM.test(key)) {
        url.searchParams.delete(key);
      }
    }
    return url.toString();
  } catch {
    return raw;
  }
}

export function displayHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
