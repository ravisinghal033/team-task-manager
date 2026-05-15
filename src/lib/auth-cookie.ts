/**
 * HTTP-only cookie transport for JWT auth (no server session store).
 * Uses `jose` for signing/verification — see `jwt.ts`.
 */
import { cookies } from "next/headers";
import { COOKIE_NAME, signSessionToken, verifySessionToken } from "./jwt";

const ONE_WEEK = 60 * 60 * 24 * 7;

export async function setAuthCookie(userId: string) {
  const token = await signSessionToken(userId);
  const store = cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_WEEK,
  });
}

export async function clearAuthCookie() {
  const store = cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function readJwtFromCookies(): Promise<string | null> {
  const store = cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

export async function readUserIdFromJwtCookie(): Promise<string | null> {
  const token = await readJwtFromCookies();
  if (!token) return null;
  const payload = await verifySessionToken(token);
  return payload?.userId ?? null;
}
