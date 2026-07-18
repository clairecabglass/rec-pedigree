import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

// Creates the Photo row for a file the browser already uploaded directly to
// R2 via a presigned URL (see /api/spooner-builds/presign) — this endpoint
// only ever sees a tiny JSON body, never the image bytes.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const build = await prisma.spoonerBuild.findUnique({ where: { id }, include: { photos: true } });
  if (!build) return NextResponse.json({ error: "Build not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const url = typeof body.url === "string" ? body.url : "";
  const key = typeof body.key === "string" ? body.key : "";
  if (!url || !key) return NextResponse.json({ error: "url and key required" }, { status: 400 });

  const photo = await prisma.spoonerBuildPhoto.create({
    data: { buildId: id, url, key, order: build.photos.length },
  });
  return NextResponse.json({ ok: true, photo });
}
