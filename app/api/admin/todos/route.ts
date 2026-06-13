import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

// The admin to-do list is stored as a JSON array in a single DiaryNote row.
const KEY = "admin_todos";

export async function GET() {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const row = await prisma.diaryNote.findUnique({ where: { key: KEY } });
  let items: unknown = [];
  try { items = row?.body ? JSON.parse(row.body) : []; } catch { items = []; }
  return NextResponse.json({ items: Array.isArray(items) ? items : [] });
}

export async function PUT(req: NextRequest) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const items = Array.isArray(body.items) ? body.items : [];
  const json = JSON.stringify(items);
  await prisma.diaryNote.upsert({
    where: { key: KEY },
    update: { body: json },
    create: { key: KEY, body: json },
  });
  return NextResponse.json({ ok: true });
}
