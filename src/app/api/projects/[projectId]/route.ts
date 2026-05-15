import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireProjectAdmin, requireProjectMember } from "@/lib/project-access";
import { projectUpdateRequestSchema } from "@/lib/validation";
import { parseJsonBody } from "@/lib/request-json";

export const dynamic = "force-dynamic";

const userSelect = { id: true, name: true, email: true, createdAt: true, updatedAt: true };

export async function GET(
  _req: Request,
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

    const full = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        description: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
        members: {
          select: {
            id: true,
            role: true,
            createdAt: true,
            user: { select: userSelect },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { tasks: true } },
      },
    });

    if (!full) {
      return jsonError("Project not found", 404);
    }

    const { _count, ...projectRest } = full;

    return jsonOk({
      project: { ...projectRest, taskCount: _count.tasks },
      myRole: access.role,
    });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

export async function PATCH(
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

    const parsed = await parseJsonBody(req, projectUpdateRequestSchema);
    if (!parsed.ok) return parsed.response;

    const data: { name?: string; description?: string | null } = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.description !== undefined) data.description = parsed.data.description ?? null;

    if (Object.keys(data).length === 0) {
      return jsonError("No changes provided", 400);
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data,
      select: {
        id: true,
        name: true,
        description: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return jsonOk({ project });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

export async function DELETE(
  _req: Request,
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

    await prisma.project.delete({ where: { id: projectId } });
    return jsonOk({ ok: true });
  } catch {
    return jsonError("Internal server error", 500);
  }
}
