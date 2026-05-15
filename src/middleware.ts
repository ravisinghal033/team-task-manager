import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/jwt";

/**
 * Page-route protection. APIs enforce auth separately via `requireAuth()`.
 * Auth is JWT-only, carried in an HTTP-only cookie (see `auth-cookie.ts` / `jwt.ts`).
 */
export async function middleware(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  let authed = false;
  if (token) {
    const session = await verifySessionToken(token);
    authed = !!session;
  }

  const { pathname } = req.nextUrl;

  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = authed ? "/dashboard" : "/login";
    return NextResponse.redirect(url);
  }

  const isProtected =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
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

  if ((pathname === "/login" || pathname === "/signup") && authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard",
    "/dashboard/:path*",
    "/projects",
    "/projects/:path*",
    "/tasks",
    "/tasks/:path*",
    "/login",
    "/signup",
  ],
};
