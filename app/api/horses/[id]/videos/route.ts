import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";
import { uploadFile, getPresignedUploadUrl, usingR2 } from "@/lib/storage";

const MAX_DIRECT_BYTES = 50 * 1024 * 1024; // 50 MB — larger files use presigned URL
const ALLOWED_MIME = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/ogg"];

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const videos = await prisma.video.findMany({
    where: { horseId: id },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(videos);
}

// POST with multipart/form-data for direct upload (small files or local dev)
export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const horse = await prisma.horse.findUnique({ where: { id }, include: { videos: { select: { id: true } } } });
  if (!horse) return NextResponse.json({ error: "Horse not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!ALLOWED_MIME.includes(file.type)) return NextResponse.json({ error: "Unsupported video type" }, { status: 400 });
  if (file.size > MAX_DIRECT_BYTES) return NextResponse.json({ error: "File too large for direct upload — use presigned upload" }, { status: 413 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await uploadFile(`horses/${id}/videos`, file.name, buffer, file.type);
  const video = await prisma.video.create({
    data: { horseId: id, url: stored.url, key: stored.key, mimeType: file.type, order: horse.videos.length },
  });
  return NextResponse.json({ ok: true, video });
}

// DELETE /api/horses/[id]/videos?videoId=xxx
export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const videoId = new URL(req.url).searchParams.get("videoId");
  if (!videoId) return NextResponse.json({ error: "videoId required" }, { status: 400 });

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video || video.horseId !== id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.video.delete({ where: { id: videoId } });
  return NextResponse.json({ ok: true });
}
