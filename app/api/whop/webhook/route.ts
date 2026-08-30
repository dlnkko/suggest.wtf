import { parseWhopPayment, fulfillWhopPayment, verifyWhopSignature } from "@/lib/whop";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.WHOP_WEBHOOK_SECRET?.trim();
  const fulfillSecret = process.env.LISTING_FULFILL_SECRET?.trim();
  if (!secret || !fulfillSecret) {
    return new Response("webhook not configured", { status: 500 });
  }

  const rawBody = await request.text();
  if (!verifyWhopSignature(rawBody, request.headers, secret)) {
    return new Response("invalid signature", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody) as unknown;
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  const type =
    payload && typeof payload === "object" && "type" in payload
      ? String((payload as { type?: unknown }).type ?? "")
      : "";

  if (type && type !== "payment.succeeded") {
    return new Response("ok", { status: 200 });
  }

  const payment = parseWhopPayment(payload);
  if (!payment) {
    return new Response("unrecognized payment", { status: 400 });
  }

  try {
    await fulfillWhopPayment(payment);
  } catch (error) {
    console.error(
      "whop_fulfill_failed",
      error instanceof Error ? error.message : "unknown",
    );
    return new Response("fulfill failed", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
