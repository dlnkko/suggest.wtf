import { createHmac, timingSafeEqual } from "node:crypto";
import { amountFromWhopPlanId, parseListingAmount } from "./constants";

const TIMESTAMP_TOLERANCE_SEC = 300;

export type WhopPayment = {
  id: string;
  email: string | null;
  amount: number;
};

export function verifyWhopSignature(
  rawBody: string,
  headers: Headers,
  secret: string,
): boolean {
  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signatureHeader = headers.get("webhook-signature");
  if (!id || !timestamp || !signatureHeader || !secret) {
    return false;
  }

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > TIMESTAMP_TOLERANCE_SEC) {
    return false;
  }

  const signed = `${id}.${timestamp}.${rawBody}`;
  const signatures = signatureHeader
    .split(/\s+/)
    .map((part) => (part.includes(",") ? part.slice(part.indexOf(",") + 1) : part))
    .filter((value) => value.length > 0);

  for (const key of hmacKeys(secret)) {
    const expected = createHmac("sha256", key).update(signed).digest("base64");
    for (const signature of signatures) {
      if (safeEqual(expected, signature)) {
        return true;
      }
    }
  }

  return false;
}

export function parseWhopPayment(payload: unknown): WhopPayment | null {
  const envelope = asRecord(payload);
  const data = asRecord(envelope?.data) ?? envelope;
  if (!data) return null;

  const id =
    firstPayId(data.id) ??
    firstPayId(envelope?.id) ??
    firstMatchingString(payload, (value) => value.startsWith("pay_"));
  if (!id) return null;

  const planId = firstMatchingString(payload, (value) => /^plan_[A-Za-z0-9]+$/.test(value));
  const amount =
    amountFromWhopPlanId(planId) ??
    parseListingAmount(data.total) ??
    parseListingAmount(data.usd_total) ??
    parseListingAmount(data.amount) ??
    amountFromCents(data.total) ??
    amountFromCents(data.usd_total) ??
    amountFromCents(data.amount);

  if (amount === null) return null;

  return {
    id,
    email: firstEmail(payload),
    amount,
  };
}

function hmacKeys(secret: string): Buffer[] {
  const keys = [Buffer.from(secret, "utf8")];
  const stripped = secret.replace(/^ws_/, "").replace(/^whsec_/, "");
  if (stripped !== secret) {
    keys.push(Buffer.from(stripped, "utf8"));
    const asHex = Buffer.from(stripped, "hex");
    if (asHex.length > 0) keys.push(asHex);
    const asB64 = Buffer.from(stripped, "base64");
    if (asB64.length > 0) keys.push(asB64);
  }
  return keys;
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function firstPayId(value: unknown): string | null {
  return typeof value === "string" && value.startsWith("pay_") ? value : null;
}

function firstEmail(value: unknown): string | null {
  return firstMatchingString(value, (candidate) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate),
  );
}

function firstMatchingString(
  value: unknown,
  match: (value: string) => boolean,
): string | null {
  if (typeof value === "string") {
    return match(value) ? value : null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstMatchingString(item, match);
      if (found) return found;
    }
    return null;
  }
  const record = asRecord(value);
  if (!record) return null;
  for (const item of Object.values(record)) {
    const found = firstMatchingString(item, match);
    if (found) return found;
  }
  return null;
}

function amountFromCents(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return parseListingAmount(value / 100);
}
