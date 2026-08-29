import { consumeClick, getSignedInEmail, hashVisitor } from "@/lib/listings";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/go/[id]">,
) {
  const { id } = await ctx.params;
  const listingId = Number(id);
  if (!Number.isInteger(listingId) || listingId <= 0) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const sourceUrl = request.nextUrl.searchParams.get("from");
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip");
  const visitor = hashVisitor(ip, request.headers.get("user-agent"));
  const visitorEmail = await getSignedInEmail();

  try {
    const result = await consumeClick({
      listingId,
      sourceUrl,
      visitorHash: visitor,
      visitorEmail,
    });

    if (!result?.url) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.redirect(result.url, 302);
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
