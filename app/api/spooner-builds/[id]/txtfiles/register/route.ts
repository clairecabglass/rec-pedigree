import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";
import { readStoredText } from "@/lib/storage";

// Creates the SpoonerBuildTxtFile row for a .txt the browser already
// uploaded directly to R2 via a presigned URL. We read the text content
// back from storage server-side (no client request-body size limit applies
// to that read) so Copy/Download still work instantly without re-fetching.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const build = await prisma.spoonerBuild.findUnique({ where: { id }, include: { txtFiles: true } });
  if (!build) return NextResponse.json({ error: "Build not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const url = typeof body.url === "string" ? body.url : "";
  const key = typeof body.key === "string" ? body.key : "";
  const fileName = typeof body.fileName === "string" ? body.fileName : "build.txt";
  if (!url || !key) return NextResponse.json({ error: "url and key required" }, { status: 400 });

  const content = await readStoredText(key);
  const txtFile = await prisma.spoonerBuildTxtFile.create({
    data: { buildId: id, fileName, url, key, content, order: build.txtFiles.length },
  });
  return NextResponse.json({ ok: true, txtFile });
}
