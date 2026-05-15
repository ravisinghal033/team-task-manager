import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/jwt";

/**
 * Protects app routes only (not `/`, `/login`, `/signup`). APIs use `requireAuth()`.
 */
export async function middleware(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  let authed = false;
  if (token) {
    const session = await verifySessionToken(token);
    authed = !!session;
  }

  const { pathname } = req.nextUrl;

  const isProtected =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/notifications" ||
    pathname.startsWith("/notifications/") ||
    pathname === "/profile" ||
    pathname.startsWith("/profile/") ||
    pathname === "/projects" ||
    pathname.startsWith("/projects/") ||
    pathname === "/tasks" ||
    pathname.startsWith("/tasks/");

  if (isProtected && !authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/notifications",
    "/notifications/:path*",
    "/profile",
    "/profile/:path*",
    "/projects",
    "/projects/:path*",
    "/tasks",
    "/tasks/:path*",
  ],
};
