import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";
import { deleteFile } from "@/lib/storage";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; txtId: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, txtId } = await params;

  const txtFile = await prisma.spoonerBuildTxtFile.findUnique({ where: { id: txtId } });
  if (!txtFile || txtFile.buildId !== id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteFile(txtFile.key);
  await prisma.spoonerBuildTxtFile.delete({ where: { id: txtId } });
  return NextResponse.json({ ok: true });
}
