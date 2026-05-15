import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { setAuthCookie } from "@/lib/auth-cookie";
import { signupRequestSchema } from "@/lib/validation";
import { jsonError, jsonOk } from "@/lib/http";
import { toPublicUser } from "@/lib/user-public";
import { parseJsonBody } from "@/lib/request-json";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const parsed = await parseJsonBody(req, signupRequestSchema);
    if (!parsed.ok) return parsed.response;

    const exists = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
      select: { id: true },
    });
    if (exists) {
      return jsonError("An account with this email already exists", 400);
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        passwordHash,
      },
    });

    await setAuthCookie(user.id);
    return jsonOk({ user: toPublicUser(user) }, 201);
  } catch {
    return jsonError("Internal server error", 500);
  }
}
