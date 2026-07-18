import { NextRequest, NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/auth";
import { getPresignedUploadUrl, usingR2 } from "@/lib/storage";

// Hands the browser a presigned R2 PUT URL so file bytes never pass through
// our serverless function — Vercel hard-caps request bodies at ~4.5MB, so
// routing uploads through the API would otherwise cap photo/file size.
export async function POST(req: NextRequest) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!usingR2) return NextResponse.json({ mode: "local" as const });

  const body = await req.json().catch(() => ({}));
  const folder = typeof body.folder === "string" ? body.folder : "";
  const fileName = typeof body.fileName === "string" ? body.fileName : "file";
  const contentType = typeof body.contentType === "string" ? body.contentType : "application/octet-stream";
  if (!folder) return NextResponse.json({ error: "folder required" }, { status: 400 });

  const presigned = await getPresignedUploadUrl(folder, fileName, contentType);
  if (!presigned) return NextResponse.json({ mode: "local" as const });
  return NextResponse.json({ mode: "r2" as const, ...presigned });
}
