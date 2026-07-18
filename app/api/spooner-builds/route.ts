import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";

const MAX_TXT_BYTES = 2 * 1024 * 1024; // 2 MB per file
const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // 4 MB per image — stays under Vercel's ~4.5MB request body cap
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

const include = {
  photos: { orderBy: { order: "asc" as const } },
  txtFiles: { orderBy: { order: "asc" as const } },
};

export async function GET() {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const builds = await prisma.spoonerBuild.findMany({ include, orderBy: { createdAt: "desc" } });
  return NextResponse.json(builds);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const title = (formData.get("title") as string)?.trim() || "";
  const location = (formData.get("location") as string)?.trim() || null;
  const category = (formData.get("category") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const discordUrl = (formData.get("discordUrl") as string)?.trim() || null;
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const build = await prisma.spoonerBuild.create({
    data: { title, location, category, description, discordUrl },
  });

  // Optional .txt spawn-data files — multiple, e.g. different versions of the same build
  const txtFiles = formData.getAll("txtFiles") as File[];
  let txtOrder = 0;
  for (const file of txtFiles) {
    if (!file || file.size === 0) continue;
    if (file.size > MAX_TXT_BYTES) return NextResponse.json({ error: "Text file too large (max 2MB)" }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await uploadFile(`spooner-builds/${build.id}`, file.name || "build.txt", buffer, "text/plain");
    await prisma.spoonerBuildTxtFile.create({
      data: {
        buildId: build.id,
        fileName: file.name || "build.txt",
        url: stored.url,
        key: stored.key,
        content: buffer.toString("utf-8"),
        order: txtOrder++,
      },
    });
  }

  // Optional photos
  const photoFiles = formData.getAll("photos") as File[];
  let order = 0;
  for (const file of photoFiles) {
    if (!file || !ALLOWED_PHOTO_TYPES.includes(file.type) || file.size > MAX_PHOTO_BYTES) continue;
    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await uploadFile(`spooner-builds/${build.id}`, file.name, buffer, file.type);
    await prisma.spoonerBuildPhoto.create({
      data: { buildId: build.id, url: stored.url, key: stored.key, order: order++ },
    });
  }

  const full = await prisma.spoonerBuild.findUnique({ where: { id: build.id }, include });
  return NextResponse.json(full);
}
