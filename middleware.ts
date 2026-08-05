import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { hasAdminRole } from "@/lib/roles";

// Create route matchers for protected routes
const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/account(.*)",
  "/cart(.*)",
  "/wishlist(.*)",
  "/orders(.*)",
  "/success(.*)",
]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const authObject = await auth();

  if (isProtectedRoute(req) && !authObject.userId) {
    const signInUrl = new URL(
      `/signin?redirect_url=${req.nextUrl.pathname}`,
      req.url
    );
    return NextResponse.redirect(signInUrl);
  }
  if (isAdminRoute(req) && authObject.userId && !hasAdminRole(authObject.sessionClaims)) {
    return NextResponse.redirect(new URL("/access-denied", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
