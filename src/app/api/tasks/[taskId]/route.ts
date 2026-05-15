import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request-json";
import { requireProjectAdmin, requireProjectMember } from "@/lib/project-access";
import {
  taskMemberStatusPatchRequestSchema,
  taskUpdateRequestSchema,
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
  _req: Request,
  { params }: { params: { taskId: string } },
) {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) return user;

    const { taskId } = params;
    const task = await prisma.task.findUnique({
      where: { id: taskId },
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
        project: { select: { id: true, name: true } },
        assignee: { select: userSelect },
        createdBy: { select: userSelect },
      },
    });
    if (!task) return jsonError("Task not found", 404);

    const access = await requireProjectMember(user.id, task.projectId);
    if (!access.ok) {
      if (access.kind === "not_found") return jsonError("Task not found", 404);
      return jsonError("Forbidden", 403);
    }

    const todayStart = startOfToday();
    const overdue =
      !!task.dueDate && task.status !== "DONE" && task.dueDate < todayStart;

    return jsonOk({ task: { ...task, overdue }, myRole: access.role });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { taskId: string } },
) {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) return user;

    const { taskId } = params;
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        projectId: true,
        assigneeId: true,
      },
    });
    if (!existing) return jsonError("Task not found", 404);

    const access = await requireProjectMember(user.id, existing.projectId);
    if (!access.ok) {
      if (access.kind === "not_found") return jsonError("Task not found", 404);
      return jsonError("Forbidden", 403);
    }

    if (access.role === "MEMBER") {
      if (existing.assigneeId !== user.id) {
        return jsonError(
          "Only the assignee may update this task, and only the status field",
          403,
        );
      }

      const parsed = await parseJsonBody(req, taskMemberStatusPatchRequestSchema);
      if (!parsed.ok) return parsed.response;

      const task = await prisma.task.update({
        where: { id: taskId },
        data: { status: parsed.data.status },
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
          project: { select: { id: true, name: true } },
          assignee: { select: userSelect },
          createdBy: { select: userSelect },
        },
      });

      const todayStart = startOfToday();
      const overdue =
        !!task.dueDate && task.status !== "DONE" && task.dueDate < todayStart;

      return jsonOk({ task: { ...task, overdue }, myRole: access.role });
    }

    const adminAccess = await requireProjectAdmin(user.id, existing.projectId);
    if (!adminAccess.ok) {
      if (adminAccess.kind === "not_found") return jsonError("Task not found", 404);
      return jsonError("Forbidden", 403);
    }

    const parsed = await parseJsonBody(req, taskUpdateRequestSchema);
    if (!parsed.ok) return parsed.response;

    const data = parsed.data;
    const requestedKeys = (Object.keys(data) as (keyof typeof data)[]).filter(
      (k) => data[k] !== undefined,
    );

    if (requestedKeys.length === 0) {
      return jsonError("No changes provided", 400);
    }

    const updatePayload: {
      title?: string;
      description?: string | null;
      status?: typeof data.status;
      priority?: typeof data.priority;
      dueDate?: Date | null;
      assigneeId?: string | null;
    } = {};

    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.description !== undefined) updatePayload.description = data.description ?? null;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.priority !== undefined) updatePayload.priority = data.priority;
    if (data.dueDate !== undefined) {
      try {
        updatePayload.dueDate = data.dueDate === null ? null : parseDueDateInput(data.dueDate);
      } catch {
        return jsonError("Invalid due date", 400);
      }
    }
    if (data.assigneeId !== undefined) {
      const nextAssignee = data.assigneeId;
      if (nextAssignee) {
        const okMember = await assigneeIsMember(existing.projectId, nextAssignee);
        if (!okMember) {
          return jsonError("Assignee must be a member of this project", 400);
        }
      }
      updatePayload.assigneeId = nextAssignee;
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updatePayload,
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
        project: { select: { id: true, name: true } },
        assignee: { select: userSelect },
        createdBy: { select: userSelect },
      },
    });

    const todayStart = startOfToday();
    const overdue =
      !!task.dueDate && task.status !== "DONE" && task.dueDate < todayStart;

    return jsonOk({ task: { ...task, overdue }, myRole: adminAccess.role });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { taskId: string } },
) {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) return user;

    const { taskId } = params;
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, projectId: true },
    });
    if (!existing) return jsonError("Task not found", 404);

    const access = await requireProjectAdmin(user.id, existing.projectId);
    if (!access.ok) {
      if (access.kind === "not_found") return jsonError("Task not found", 404);
      return jsonError("Forbidden", 403);
    }

    await prisma.task.delete({ where: { id: taskId } });
    return jsonOk({ ok: true });
  } catch {
    return jsonError("Internal server error", 500);
  }
}
