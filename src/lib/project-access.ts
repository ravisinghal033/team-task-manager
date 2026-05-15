import type { ProjectRole } from "@prisma/client";
import { prisma } from "./prisma";

export async function getProjectRole(
  userId: string,
  projectId: string,
): Promise<ProjectRole | null> {
  const row = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { role: true },
  });
  return row?.role ?? null;
}

export async function requireProjectMember(userId: string, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        where: { userId },
        take: 1,
      },
    },
  });

  if (!project) return { ok: false as const, kind: "not_found" as const };
  const membership = project.members[0];
  if (!membership) return { ok: false as const, kind: "forbidden" as const };

  return { ok: true as const, project, role: membership.role, memberId: membership.id };
}

export async function requireProjectAdmin(userId: string, projectId: string) {
  const res = await requireProjectMember(userId, projectId);
  if (!res.ok) return res;
  if (res.role !== "ADMIN") return { ok: false as const, kind: "forbidden" as const };
  return res;
}
