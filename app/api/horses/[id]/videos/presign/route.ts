import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";
import { getPresignedUploadUrl, usingR2 } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

// Step 1 — browser asks for a presigned R2 URL
export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const horse = await prisma.horse.findUnique({ where: { id }, select: { id: true } });
  if (!horse) return NextResponse.json({ error: "Horse not found" }, { status: 404 });

  if (!usingR2) return NextResponse.json({ mode: "local" as const });

  const body = await req.json().catch(() => ({}));
  const fileName = typeof body.fileName === "string" ? body.fileName : "video.mp4";
  const contentType = typeof body.contentType === "string" ? body.contentType : "video/mp4";

  const presigned = await getPresignedUploadUrl(`horses/${id}/videos`, fileName, contentType);
  if (!presigned) return NextResponse.json({ mode: "local" as const });
  return NextResponse.json({ mode: "r2" as const, ...presigned });
}
