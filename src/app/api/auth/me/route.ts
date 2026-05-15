import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { jsonOk } from "@/lib/http";
import { toPublicUser } from "@/lib/user-public";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireAuth();
  if (user instanceof NextResponse) return user;
  return jsonOk({ user: toPublicUser(user) });
}
