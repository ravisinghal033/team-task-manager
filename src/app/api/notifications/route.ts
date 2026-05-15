import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { loadDashboardAggregate, loadNotificationCount } from "@/lib/dashboard-aggregate";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function cacheHeaders() {
  return { "Cache-Control": "no-store, no-cache, must-revalidate" };
}

/** ?countOnly=1 → { count } with 2 DB queries. Otherwise full notification lists (3 queries). */
export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) return user;

    const { searchParams } = new URL(req.url);
    if (searchParams.get("countOnly") === "1") {
      const { count, queryCount } = await loadNotificationCount(user.id);
      return NextResponse.json({ count, _meta: { queryCount } }, { status: 200, headers: cacheHeaders() });
    }

    const { queryCount, payload } = await loadDashboardAggregate(user);

    return NextResponse.json(
      {
        count: payload.notifications.length,
        notifications: payload.notifications,
        assignedToMe: payload.assignedToMeTasks,
        dueSoon: payload.dueSoonTasks,
        overdue: payload.overdueTasks,
        isAdminOnAny: payload.isAdminOnAny,
        _meta: { queryCount },
      },
      { status: 200, headers: cacheHeaders() },
    );
  } catch (e) {
    console.error("[notifications]", e);
    return jsonError("Notifications could not load. Please retry.", 503);
  }
}
