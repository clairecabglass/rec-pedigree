import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

const CHARACTERS = new Set(["Athena Redfield", "Lucille"]);

/** POST /api/horses/bulk-character  Body: { ids: string[], character: string } */
export async function POST(req: NextRequest) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const ids = Array.isArray(body.ids) ? body.ids.filter((x: unknown): x is string => typeof x === "string") : [];
  const character = typeof body.character === "string" ? body.character : "";
  if (!ids.length) return NextResponse.json({ error: "No horse ids supplied" }, { status: 400 });
  if (!CHARACTERS.has(character)) return NextResponse.json({ error: "Unknown character" }, { status: 400 });
  const result = await prisma.horse.updateMany({
    where: { id: { in: ids } },
    data: { assignedCharacter: character },
  });
  return NextResponse.json({ ok: true, updated: result.count });
}
