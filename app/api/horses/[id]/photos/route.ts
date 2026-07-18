import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB per image
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const horse = await prisma.horse.findUnique({ where: { id }, include: { photos: true } });
  if (!horse) return NextResponse.json({ error: "Horse not found" }, { status: 404 });

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];
  if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 });

  const created: Awaited<ReturnType<typeof prisma.photo.create>>[] = [];
  let order = horse.photos.length;
  let needsPrimary = !horse.photos.some((p) => p.isPrimary);

  for (const file of files) {
    if (!ALLOWED.includes(file.type)) continue;
    if (file.size > MAX_BYTES) continue;
    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await uploadFile(`horses/${id}`, file.name, buffer, file.type);
    const photo = await prisma.photo.create({
      data: {
        horseId: id,
        url: stored.url,
        key: stored.key,
        order: order++,
        isPrimary: needsPrimary,
      },
    });
    needsPrimary = false;
    created.push(photo);
  }

  return NextResponse.json({ ok: true, created });
}
