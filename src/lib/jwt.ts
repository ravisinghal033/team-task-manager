/**
 * Stateless JWT auth (HS256 via `jose`). Tokens live only in HTTP-only cookies
 * (`auth-cookie.ts`); there is no server-side session store.
 */
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "ttm_session";

export { COOKIE_NAME };

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET must be set and at least 16 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    if (!sub) return null;
    return { userId: sub };
  } catch {
    return null;
  }
}
