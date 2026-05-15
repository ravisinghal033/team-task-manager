import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request-json";
import { projectCreateRequestSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const userSelect = { id: true, name: true, email: true, createdAt: true, updatedAt: true };

export async function GET() {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) return user;

    const projects = await prisma.project.findMany({
      where: { members: { some: { userId: user.id } } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
        members: {
          select: {
            role: true,
            user: { select: userSelect },
          },
        },
        _count: { select: { tasks: true } },
      },
    });

    const shaped = projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      ownerId: p.ownerId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      taskCount: p._count.tasks,
      members: p.members.map((m) => ({ role: m.role, user: m.user })),
      myRole: p.members.find((m) => m.user.id === user.id)?.role ?? null,
    }));

    return jsonOk({ projects: shaped });
  } catch {
    return jsonError("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    if (user instanceof NextResponse) return user;

    const parsed = await parseJsonBody(req, projectCreateRequestSchema);
    if (!parsed.ok) return parsed.response;

    const project = await prisma.project.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        ownerId: user.id,
        members: {
          create: [{ userId: user.id, role: "ADMIN" }],
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return jsonOk({ project }, 201);
  } catch {
    return jsonError("Internal server error", 500);
  }
}
