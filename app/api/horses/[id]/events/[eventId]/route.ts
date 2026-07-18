import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";
import { deleteFile, uploadFile } from "@/lib/storage";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; eventId: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, eventId } = await params;

  const formData = await req.formData();
  const title = (formData.get("title") as string)?.trim();
  const date = formData.get("date") as string;
  const type = (formData.get("type") as string) || "note";
  const description = (formData.get("description") as string)?.trim() || null;
  const removeImage = formData.get("removeImage") === "true";
  const file = formData.get("image") as File | null;

  const existing = await prisma.horseEvent.findUnique({ where: { id: eventId } });
  if (!existing || existing.horseId !== id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let imageUrl = existing.imageUrl;
  let imageKey = existing.imageKey;

  if (removeImage && existing.imageKey) {
    try { await deleteFile(existing.imageKey); } catch { /* ignore */ }
    imageUrl = null; imageKey = null;
  } else if (file && ALLOWED.includes(file.type)) {
    if (existing.imageKey) try { await deleteFile(existing.imageKey); } catch { /* ignore */ }
    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await uploadFile(`horses/${id}/events`, file.name, buffer, file.type);
    imageUrl = stored.url; imageKey = stored.key;
  }

  const updated = await prisma.horseEvent.update({
    where: { id: eventId },
    data: { title, date: new Date(date), type, description, imageUrl, imageKey },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string; eventId: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { eventId, id } = await params;
  const ev = await prisma.horseEvent.findUnique({ where: { id: eventId } });
  if (!ev || ev.horseId !== id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ev.imageKey) try { await deleteFile(ev.imageKey); } catch { /* ignore */ }
  await prisma.horseEvent.delete({ where: { id: eventId } });
  return NextResponse.json({ ok: true });
}
