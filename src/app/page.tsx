import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verifySessionToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (token) {
    const session = await verifySessionToken(token);
    if (session) redirect("/dashboard");
  }
  redirect("/login");
}
