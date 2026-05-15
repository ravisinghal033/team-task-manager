import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { setAuthCookie } from "@/lib/auth-cookie";
import { loginRequestSchema } from "@/lib/validation";
import { jsonError, jsonOk } from "@/lib/http";
import { toPublicUser } from "@/lib/user-public";
import { parseJsonBody } from "@/lib/request-json";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const parsed = await parseJsonBody(req, loginRequestSchema);
    if (!parsed.ok) return parsed.response;

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });
    if (!user) {
      return jsonError("Invalid email or password", 401);
    }

    const ok = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!ok) {
      return jsonError("Invalid email or password", 401);
    }

    await setAuthCookie(user.id);
    return jsonOk({ user: toPublicUser(user) });
  } catch {
    return jsonError("Internal server error", 500);
  }
}
