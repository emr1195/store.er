import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

// Create route matchers for protected routes
export function middleware(req: NextRequest) {
  if (!getSessionCookie(req)) {
    const signInUrl = new URL(
      `/signin?redirect_url=${req.nextUrl.pathname}`,
      req.url
    );
    return NextResponse.redirect(signInUrl);
  }
  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: ["/admin/:path*", "/account/:path*", "/cart/:path*", "/wishlist/:path*", "/orders/:path*", "/success/:path*"],
};
