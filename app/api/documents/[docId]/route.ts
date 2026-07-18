import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";
import { deleteFile } from "@/lib/storage";

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ docId: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { docId } = await params;

  const doc = await prisma.document.findUnique({ where: { id: docId } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteFile(doc.key);
  await prisma.document.delete({ where: { id: docId } });
  return NextResponse.json({ ok: true });
}
