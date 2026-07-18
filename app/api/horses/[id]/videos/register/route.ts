import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

// Step 2 — after browser uploads directly to R2, register the video in DB
export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const { key, publicUrl, mimeType } = body as Record<string, string>;
  if (!key || !publicUrl) return NextResponse.json({ error: "key and publicUrl required" }, { status: 400 });

  const existing = await prisma.video.count({ where: { horseId: id } });
  const video = await prisma.video.create({
    data: { horseId: id, url: publicUrl, key, mimeType: mimeType ?? "video/mp4", order: existing },
  });
  return NextResponse.json({ ok: true, video });
}
