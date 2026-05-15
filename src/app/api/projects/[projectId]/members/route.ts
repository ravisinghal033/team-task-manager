import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireProjectAdmin, requireProjectMember } from "@/lib/project-access";
import { memberAddRequestSchema } from "@/lib/validation";
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

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: { select: userSelect },
      },
    });

    return jsonOk({ members });
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

    const parsed = await parseJsonBody(req, memberAddRequestSchema);
    if (!parsed.ok) return parsed.response;

    const invitee = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
      select: { id: true },
    });
    if (!invitee) {
      return jsonError("No user found with that email", 404);
    }

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: invitee.id } },
      select: { id: true },
    });
    if (existing) {
      return jsonError("User is already a member of this project", 400);
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: invitee.id,
        role: "MEMBER",
      },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: { select: userSelect },
      },
    });

    return jsonOk({ member }, 201);
  } catch {
    return jsonError("Internal server error", 500);
  }
}
