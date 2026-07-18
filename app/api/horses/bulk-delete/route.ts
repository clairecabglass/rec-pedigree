import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

/**
 * POST /api/horses/bulk-delete
 * Body: { ids: string[] }
 * Auth: admin only.
 */
export async function POST(req: NextRequest) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { ids?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === "string") : [];
  if (!ids.length) {
    return NextResponse.json({ error: "No horse ids supplied" }, { status: 400 });
  }
  const result = await prisma.horse.deleteMany({ where: { id: { in: ids } } });
  return NextResponse.json({ ok: true, deleted: result.count });
}
