import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

// Public-facing breeding policies text, admin-editable.
const KEY = "breeding_policies";

export async function GET() {
  const row = await prisma.diaryNote.findUnique({ where: { key: KEY } });
  return NextResponse.json({ body: row?.body ?? "", updatedAt: row?.updatedAt ?? null });
}

export async function PUT(req: NextRequest) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const text = typeof body.body === "string" ? body.body : "";
  const saved = await prisma.diaryNote.upsert({
    where: { key: KEY },
    update: { body: text },
    create: { key: KEY, body: text },
  });
  return NextResponse.json({ body: saved.body, updatedAt: saved.updatedAt });
}
