import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip auth check for public paths
  if (
    pathname === "/login" ||
    pathname === "/offline" ||
    pathname === "/sw.js" ||
    pathname === "/manifest.webmanifest" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/splash") ||
    pathname.startsWith("/screenshots") ||
    pathname.startsWith("/_next")
  ) {
    return NextResponse.next();
  }

  // Check for session cookie (Better Auth uses __Secure-better-auth.session_token in prod, better-auth.session_token in dev)
  const sessionCookie =
    req.cookies.get("better-auth.session_token") ||
    req.cookies.get("__Secure-better-auth.session_token");

  if (!sessionCookie) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
