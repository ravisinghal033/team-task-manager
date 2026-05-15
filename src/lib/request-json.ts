import type { ZodType } from "zod";
import { NextResponse } from "next/server";
import { jsonError } from "./http";
import { formatZodError } from "./validation";

export type ParseJsonResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

/**
 * Parse JSON body and validate with Zod. Returns 400 on malformed JSON or validation errors.
 */
export async function parseJsonBody<T>(req: Request, schema: ZodType<T>): Promise<ParseJsonResult<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false, response: jsonError("Invalid JSON body", 400) };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      response: jsonError("Validation failed", 400, formatZodError(parsed.error)),
    };
  }

  return { ok: true, data: parsed.data };
}
