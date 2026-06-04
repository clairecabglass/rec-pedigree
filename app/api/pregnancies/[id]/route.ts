import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

// PATCH: mark born (promotes the foal into the registry) or edit due date.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const pregnancy = await prisma.pregnancy.findUnique({ where: { id } });
  if (!pregnancy) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.markBorn) {
    if (pregnancy.foalId) {
      await prisma.horse.update({
        where: { id: pregnancy.foalId },
        data: { ownership: "Home", dob: body.dob ? new Date(body.dob) : new Date() },
      });
    }
    const updated = await prisma.pregnancy.update({ where: { id }, data: { status: "born" } });
    return NextResponse.json(updated);
  }

  const updated = await prisma.pregnancy.update({
    where: { id },
    data: {
      dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : undefined,
      sireName: body.sireName,
      notes: body.notes,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const pregnancy = await prisma.pregnancy.findUnique({ where: { id } });
  if (!pregnancy) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // If the foal is still an unborn placeholder, remove it too.
  if (pregnancy.foalId) {
    const foal = await prisma.horse.findUnique({ where: { id: pregnancy.foalId } });
    if (foal && foal.ownership === "Expected") {
      await prisma.horse.delete({ where: { id: foal.id } }).catch(() => {});
    }
  }
  await prisma.pregnancy.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
