import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";
import { deleteFile } from "@/lib/storage";

// PATCH: update caption, order, or set as primary
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ photoId: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { photoId } = await params;
  const body = await req.json();

  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.makePrimary) {
    await prisma.$transaction([
      prisma.photo.updateMany({ where: { horseId: photo.horseId }, data: { isPrimary: false } }),
      prisma.photo.update({ where: { id: photoId }, data: { isPrimary: true } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (Array.isArray(body.order)) {
    // body.order = array of photoIds in new order
    await prisma.$transaction(
      body.order.map((pid: string, i: number) =>
        prisma.photo.update({ where: { id: pid }, data: { order: i } })
      )
    );
    return NextResponse.json({ ok: true });
  }

  if (typeof body.fill === "boolean") {
    const updated = await prisma.photo.update({ where: { id: photoId }, data: { fill: body.fill } });
    return NextResponse.json(updated);
  }

  const updated = await prisma.photo.update({
    where: { id: photoId },
    data: { caption: body.caption },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ photoId: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { photoId } = await params;

  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteFile(photo.key);
  await prisma.photo.delete({ where: { id: photoId } });

  // If we removed the primary, promote the next photo.
  if (photo.isPrimary) {
    const next = await prisma.photo.findFirst({
      where: { horseId: photo.horseId },
      orderBy: { order: "asc" },
    });
    if (next) await prisma.photo.update({ where: { id: next.id }, data: { isPrimary: true } });
  }

  return NextResponse.json({ ok: true });
}
