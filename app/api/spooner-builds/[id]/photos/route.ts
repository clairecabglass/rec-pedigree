import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB per image — stays under Vercel's ~4.5MB request body cap
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const build = await prisma.spoonerBuild.findUnique({ where: { id }, include: { photos: true } });
  if (!build) return NextResponse.json({ error: "Build not found" }, { status: 404 });

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];
  if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 });

  const created: Awaited<ReturnType<typeof prisma.spoonerBuildPhoto.create>>[] = [];
  let order = build.photos.length;

  for (const file of files) {
    if (!ALLOWED.includes(file.type) || file.size > MAX_BYTES) continue;
    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await uploadFile(`spooner-builds/${id}`, file.name, buffer, file.type);
    const photo = await prisma.spoonerBuildPhoto.create({
      data: { buildId: id, url: stored.url, key: stored.key, order: order++ },
    });
    created.push(photo);
  }

  return NextResponse.json({ ok: true, created });
}
