import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";
import { uploadFile, deleteFile } from "@/lib/storage";

const MAX_TXT_BYTES = 2 * 1024 * 1024; // 2 MB per file

const include = {
  photos: { orderBy: { order: "asc" as const } },
  txtFiles: { orderBy: { order: "asc" as const } },
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const build = await prisma.spoonerBuild.findUnique({ where: { id }, include });
  if (!build) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(build);
}

// Accepts either JSON (text-field-only edits) or multipart form data (when
// adding new .txt file versions alongside text fields). New .txt files are
// appended as additional versions, not a replacement — removing an old
// version is a separate DELETE on /txtfiles/[txtId].
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.spoonerBuild.findUnique({ where: { id }, include: { txtFiles: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contentType = req.headers.get("content-type") || "";
  const data: Record<string, unknown> = {};

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    if (formData.has("title")) data.title = ((formData.get("title") as string) || "").trim();
    if (formData.has("location")) data.location = (formData.get("location") as string)?.trim() || null;
    if (formData.has("category")) data.category = (formData.get("category") as string)?.trim() || null;
    if (formData.has("description")) data.description = (formData.get("description") as string)?.trim() || null;
    if (formData.has("discordUrl")) data.discordUrl = (formData.get("discordUrl") as string)?.trim() || null;

    const txtFiles = formData.getAll("txtFiles") as File[];
    let order = existing.txtFiles.length;
    for (const file of txtFiles) {
      if (!file || file.size === 0) continue;
      if (file.size > MAX_TXT_BYTES) return NextResponse.json({ error: "Text file too large (max 2MB)" }, { status: 400 });
      const buffer = Buffer.from(await file.arrayBuffer());
      const stored = await uploadFile(`spooner-builds/${id}`, file.name || "build.txt", buffer, "text/plain");
      await prisma.spoonerBuildTxtFile.create({
        data: {
          buildId: id,
          fileName: file.name || "build.txt",
          url: stored.url,
          key: stored.key,
          content: buffer.toString("utf-8"),
          order: order++,
        },
      });
    }
  } else {
    const body = await req.json().catch(() => ({}));
    if (typeof body.title === "string") data.title = body.title.trim();
    if ("location" in body) data.location = typeof body.location === "string" ? body.location.trim() || null : null;
    if ("category" in body) data.category = typeof body.category === "string" ? body.category.trim() || null : null;
    if ("description" in body) data.description = typeof body.description === "string" ? body.description.trim() || null : null;
    if ("discordUrl" in body) data.discordUrl = typeof body.discordUrl === "string" ? body.discordUrl.trim() || null : null;
  }

  if (typeof data.title === "string" && !data.title) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const updated = await prisma.spoonerBuild.update({ where: { id }, data, include });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const build = await prisma.spoonerBuild.findUnique({ where: { id }, include: { photos: true, txtFiles: true } });
  if (!build) return NextResponse.json({ error: "Not found" }, { status: 404 });

  for (const p of build.photos) await deleteFile(p.key);
  for (const t of build.txtFiles) await deleteFile(t.key);

  await prisma.spoonerBuild.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
