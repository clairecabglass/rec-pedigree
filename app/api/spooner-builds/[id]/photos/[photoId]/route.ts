import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";
import { deleteFile } from "@/lib/storage";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, photoId } = await params;

  const photo = await prisma.spoonerBuildPhoto.findUnique({ where: { id: photoId } });
  if (!photo || photo.buildId !== id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteFile(photo.key);
  await prisma.spoonerBuildPhoto.delete({ where: { id: photoId } });
  return NextResponse.json({ ok: true });
}
