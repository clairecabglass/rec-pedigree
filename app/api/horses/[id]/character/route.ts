import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

const CHARACTERS = new Set(["Athena Redfield", "Lucille"]);

// PATCH: change a single horse's assignedCharacter.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const next = typeof body.assignedCharacter === "string" ? body.assignedCharacter : null;
  if (next != null && !CHARACTERS.has(next)) {
    return NextResponse.json({ error: "Unknown character" }, { status: 400 });
  }
  const updated = await prisma.horse.update({
    where: { id },
    data: { assignedCharacter: next },
    select: { id: true, assignedCharacter: true },
  });
  return NextResponse.json(updated);
}
