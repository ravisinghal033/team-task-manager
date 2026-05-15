import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const userSelect = { id: true, name: true, email: true, createdAt: true, updatedAt: true };

export async function GET() {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) return user;

    const memberships = await prisma.projectMember.findMany({
      where: { userId: user.id },
      select: { projectId: true },
    });
    const projectIds = [...new Set(memberships.map((m) => m.projectId))];

    if (projectIds.length === 0) {
      return jsonOk({
        totalProjects: 0,
        totalTasks: 0,
        tasksAssignedToMe: 0,
        tasksByStatus: { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
        overdueCount: 0,
        overdueTasks: [],
        recentTasks: [],
        projectProgress: [],
      });
    }

    const todayStart = startOfToday();

    const [
      totalProjects,
      totalTasks,
      tasksAssignedToMe,
      statusGroups,
      overdueTasks,
      recentTasks,
      doneByProject,
      totalByProject,
      projectsMeta,
    ] = await Promise.all([
      Promise.resolve(projectIds.length),
      prisma.task.count({ where: { projectId: { in: projectIds } } }),
      prisma.task.count({
        where: { projectId: { in: projectIds }, assigneeId: user.id },
      }),
      prisma.task.groupBy({
        by: ["status"],
        where: { projectId: { in: projectIds } },
        _count: { _all: true },
      }),
      prisma.task.findMany({
        where: {
          projectId: { in: projectIds },
          status: { not: "DONE" },
          dueDate: { lt: todayStart },
        },
        orderBy: { dueDate: "asc" },
        take: 25,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          projectId: true,
          assigneeId: true,
          createdAt: true,
          project: { select: { id: true, name: true } },
          assignee: { select: userSelect },
        },
      }),
      prisma.task.findMany({
        where: { projectId: { in: projectIds } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          projectId: true,
          assigneeId: true,
          createdAt: true,
          project: { select: { id: true, name: true } },
          assignee: { select: userSelect },
        },
      }),
      prisma.task.groupBy({
        by: ["projectId"],
        where: { projectId: { in: projectIds }, status: "DONE" },
        _count: { _all: true },
      }),
      prisma.task.groupBy({
        by: ["projectId"],
        where: { projectId: { in: projectIds } },
        _count: { _all: true },
      }),
      prisma.project.findMany({
        where: { id: { in: projectIds } },
        select: { id: true, name: true },
      }),
    ]);

    const tasksByStatus = {
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0,
    } as Record<"TODO" | "IN_PROGRESS" | "DONE", number>;
    for (const row of statusGroups) {
      tasksByStatus[row.status] = row._count._all;
    }

    const doneMap = new Map(doneByProject.map((r) => [r.projectId, r._count._all]));
    const totalMap = new Map(totalByProject.map((r) => [r.projectId, r._count._all]));

    const projectProgress = projectsMeta.map((p) => {
      const total = totalMap.get(p.id) ?? 0;
      const done = doneMap.get(p.id) ?? 0;
      const progressPercent = total === 0 ? 0 : Math.round((done / total) * 100);
      return {
        projectId: p.id,
        name: p.name,
        totalTasks: total,
        doneTasks: done,
        progressPercent,
      };
    });

    return jsonOk({
      totalProjects,
      totalTasks,
      tasksAssignedToMe,
      tasksByStatus,
      overdueCount: overdueTasks.length,
      overdueTasks,
      recentTasks,
      projectProgress,
    });
  } catch {
    return jsonError("Internal server error", 500);
  }
}
