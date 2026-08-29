import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/list";
  }
  return value;
}

function withAuthError(origin: string, next: string): string {
  try {
    const target = new URL(next, origin);
    if (target.pathname === "/suggest") {
      const url = target.searchParams.get("url") ?? "";
      const continueTo = new URL("/continue", origin);
      if (url) continueTo.searchParams.set("url", url);
      continueTo.searchParams.set("error", "auth");
      return continueTo.toString();
    }
    target.searchParams.set("error", "auth");
    return target.toString();
  } catch {
    return `${origin}/list?error=auth`;
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(withAuthError(origin, next));
}
