import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { loadDashboardAggregate } from "@/lib/dashboard-aggregate";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function cacheHeaders() {
  return { "Cache-Control": "no-store, no-cache, must-revalidate" };
}

export async function GET() {
  const startedAt = Date.now();

  if (process.env.NODE_ENV === "development") {
    console.log("[dashboard API] start");
  }

  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) return user;

    const { queryCount, payload } = await loadDashboardAggregate(user);

    if (process.env.NODE_ENV === "development") {
      console.log(`[dashboard API] success in ${Date.now() - startedAt}ms (${queryCount} queries)`);
    }

    return NextResponse.json(
      { ok: true, dashboard: payload },
      { status: 200, headers: cacheHeaders() },
    );
  } catch (error) {
    console.error("Dashboard API failed:", error);

    if (process.env.NODE_ENV === "development") {
      console.log(`[dashboard API] failed in ${Date.now() - startedAt}ms`);
    }

    return NextResponse.json(
      { ok: false, error: "Dashboard data could not load." },
      { status: 500, headers: cacheHeaders() },
    );
  }
}
