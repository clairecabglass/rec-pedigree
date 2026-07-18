import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB per document

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const horse = await prisma.horse.findUnique({ where: { id } });
  if (!horse) return NextResponse.json({ error: "Horse not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const label = (formData.get("label") as string) || file?.name || "Document";
  const type = (formData.get("type") as string) || "other";
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 25MB)" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await uploadFile(`docs/${id}`, file.name, buffer, file.type || "application/octet-stream");

  const doc = await prisma.document.create({
    data: { horseId: id, url: stored.url, key: stored.key, label, type },
  });
  return NextResponse.json({ ok: true, doc });
}
