import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireProjectAdmin } from "@/lib/project-access";
import { memberRoleUpdateRequestSchema } from "@/lib/validation";
import { parseJsonBody } from "@/lib/request-json";

export const dynamic = "force-dynamic";

const userSelect = { id: true, name: true, email: true, createdAt: true, updatedAt: true };

export async function PATCH(
  req: Request,
  { params }: { params: { projectId: string; memberId: string } },
) {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) return user;

    const { projectId, memberId } = params;
    const access = await requireProjectAdmin(user.id, projectId);
    if (!access.ok) {
      if (access.kind === "not_found") return jsonError("Project not found", 404);
      return jsonError("Forbidden", 403);
    }

    const parsed = await parseJsonBody(req, memberRoleUpdateRequestSchema);
    if (!parsed.ok) return parsed.response;

    const member = await prisma.projectMember.findFirst({
      where: { id: memberId, projectId },
      select: { id: true, userId: true, role: true },
    });
    if (!member) return jsonError("Member not found", 404);

    if (member.role === "ADMIN" && parsed.data.role === "MEMBER") {
      const adminCount = await prisma.projectMember.count({
        where: { projectId, role: "ADMIN" },
      });
      if (adminCount <= 1) {
        return jsonError("Project must keep at least one admin", 400);
      }
    }

    const updated = await prisma.projectMember.update({
      where: { id: memberId },
      data: { role: parsed.data.role },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: { select: userSelect },
      },
    });

    return jsonOk({ member: updated });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { projectId: string; memberId: string } },
) {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) return user;

    const { projectId, memberId } = params;
    const access = await requireProjectAdmin(user.id, projectId);
    if (!access.ok) {
      if (access.kind === "not_found") return jsonError("Project not found", 404);
      return jsonError("Forbidden", 403);
    }

    const member = await prisma.projectMember.findFirst({
      where: { id: memberId, projectId },
      select: { id: true, userId: true, role: true },
    });
    if (!member) return jsonError("Member not found", 404);

    if (member.userId === user.id) {
      return jsonError("You cannot remove yourself from the project", 400);
    }

    if (member.role === "ADMIN") {
      const adminCount = await prisma.projectMember.count({
        where: { projectId, role: "ADMIN" },
      });
      if (adminCount <= 1) {
        return jsonError("Cannot remove the last admin from the project", 400);
      }
    }

    await prisma.projectMember.delete({ where: { id: memberId } });
    return jsonOk({ ok: true });
  } catch {
    return jsonError("Internal server error", 500);
  }
}
