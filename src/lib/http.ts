import { NextResponse } from "next/server";

export function jsonError(message: string, status: number, details?: unknown) {
  const body: Record<string, unknown> = { error: message };
  if (details !== undefined) body.details = details;
  return NextResponse.json(body, { status });
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
