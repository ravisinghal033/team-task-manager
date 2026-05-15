import { clearAuthCookie } from "@/lib/auth-cookie";
import { jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearAuthCookie();
  return jsonOk({ ok: true });
}
