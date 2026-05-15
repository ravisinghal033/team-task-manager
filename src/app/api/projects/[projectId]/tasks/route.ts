import type { Prisma, TaskPriority, TaskStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireProjectAdmin, requireProjectMember } from "@/lib/project-access";
import { parseJsonBody } from "@/lib/request-json";
import {
  formatZodError,
  searchParamsToRecord,
  taskCreateRequestSchema,
  taskListQuerySchema,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

const userSelect = { id: true, name: true, email: true, createdAt: true, updatedAt: true };

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDueDateInput(v: string | null | undefined): Date | null {
  if (v === undefined || v === null || v === "") return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) {
    throw new Error("INVALID_DUE_DATE");
  }
  return d;
}

async function assigneeIsMember(projectId: string, assigneeId: string) {
  const m = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: assigneeId } },
    select: { id: true },
  });
  return !!m;
}

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } },
) {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) return user;

    const { projectId } = params;
    const access = await requireProjectMember(user.id, projectId);
    if (!access.ok) {
      if (access.kind === "not_found") return jsonError("Project not found", 404);
      return jsonError("Forbidden", 403);
    }

    const { searchParams } = new URL(req.url);
    const qParsed = taskListQuerySchema.safeParse(searchParamsToRecord(searchParams));
    if (!qParsed.success) {
      return jsonError("Validation failed", 400, formatZodError(qParsed.error));
    }
    const q = qParsed.data;

    const conditions: Prisma.TaskWhereInput[] = [{ projectId }];

    if (q.status) {
      conditions.push({ status: q.status as TaskStatus });
    }

    if (q.priority) {
      conditions.push({ priority: q.priority as TaskPriority });
    }

    if (q.assigneeId) {
      const aid = q.assigneeId === "me" ? user.id : q.assigneeId;
      conditions.push({ assigneeId: aid });
    }

    if (q.overdue === "true") {
      conditions.push({ status: { not: "DONE" } });
      conditions.push({ dueDate: { not: null } });
      conditions.push({ dueDate: { lt: startOfToday() } });
    }

    const where: Prisma.TaskWhereInput =
      conditions.length > 1 ? { AND: conditions } : { projectId };

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        projectId: true,
        assigneeId: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        assignee: { select: userSelect },
        createdBy: { select: userSelect },
      },
    });

    const todayStart = startOfToday();
    const shaped = tasks.map((t) => ({
      ...t,
      overdue:
        !!t.dueDate &&
        t.status !== "DONE" &&
        t.dueDate < todayStart,
    }));

    return jsonOk({ tasks: shaped });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } },
) {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) return user;

    const { projectId } = params;
    const access = await requireProjectAdmin(user.id, projectId);
    if (!access.ok) {
      if (access.kind === "not_found") return jsonError("Project not found", 404);
      return jsonError("Forbidden", 403);
    }

    const parsed = await parseJsonBody(req, taskCreateRequestSchema);
    if (!parsed.ok) return parsed.response;

    let dueDate: Date | null;
    try {
      dueDate = parseDueDateInput(parsed.data.dueDate ?? null);
    } catch {
      return jsonError("Invalid due date", 400);
    }

    const assigneeId = parsed.data.assigneeId ?? null;
    if (assigneeId) {
      const okMember = await assigneeIsMember(projectId, assigneeId);
      if (!okMember) {
        return jsonError("Assignee must be a member of this project", 400);
      }
    }

    const task = await prisma.task.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        status: parsed.data.status ?? "TODO",
        priority: parsed.data.priority ?? "MEDIUM",
        dueDate,
        projectId,
        assigneeId,
        createdById: user.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        projectId: true,
        assigneeId: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        assignee: { select: userSelect },
        createdBy: { select: userSelect },
      },
    });

    return jsonOk({ task }, 201);
  } catch {
    return jsonError("Internal server error", 500);
  }
}
