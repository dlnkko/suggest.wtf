import { cookies } from "next/headers";

const COOKIE = "suggest_checkout";

export type CheckoutReturn = "paid" | "topup";

export async function markCheckoutReturn(kind: CheckoutReturn) {
  const jar = await cookies();
  jar.set(COOKIE, kind, {
    path: "/",
    maxAge: 60 * 30,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function takeCheckoutReturn(): Promise<CheckoutReturn | null> {
  const jar = await cookies();
  const value = jar.get(COOKIE)?.value;
  if (value !== "paid" && value !== "topup") {
    return null;
  }
  try {
    jar.delete(COOKIE);
  } catch {
    // Server Component may not be able to mutate cookies.
  }
  return value;
}
