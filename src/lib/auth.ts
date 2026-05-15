import type { User } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { readUserIdFromJwtCookie } from "./auth-cookie";
import { jsonError } from "./http";

export async function getCurrentUser(): Promise<User | null> {
  const userId = await readUserIdFromJwtCookie();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

/** Returns the authenticated user or a 401 JSON response. */
export async function requireAuth(): Promise<User | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);
  return user;
}
