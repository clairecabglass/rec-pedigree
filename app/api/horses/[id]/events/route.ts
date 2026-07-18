import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const events = await prisma.horseEvent.findMany({
    where: { horseId: id },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const horse = await prisma.horse.findUnique({ where: { id } });
  if (!horse) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const title = (formData.get("title") as string)?.trim();
  const date = formData.get("date") as string;
  const type = (formData.get("type") as string) || "note";
  const description = (formData.get("description") as string)?.trim() || null;
  const file = formData.get("image") as File | null;

  if (!title || !date) return NextResponse.json({ error: "title and date required" }, { status: 400 });

  let imageUrl: string | null = null;
  let imageKey: string | null = null;
  if (file && ALLOWED.includes(file.type)) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await uploadFile(`horses/${id}/events`, file.name, buffer, file.type);
    imageUrl = stored.url;
    imageKey = stored.key;
  }

  const orderRaw = formData.get("order");
  const order = orderRaw !== null ? Number(orderRaw) : (await prisma.horseEvent.count({ where: { horseId: id } }));

  const event = await prisma.horseEvent.create({
    data: { horseId: id, date: new Date(date), title, description, type, imageUrl, imageKey, order },
  });
  return NextResponse.json(event);
}

// Bulk reorder: [{id, order, date?}]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json() as { events: { id: string; order: number; date?: string }[] };
  await Promise.all(body.events.map(e =>
    prisma.horseEvent.updateMany({
      where: { id: e.id, horseId: id },
      data: { order: e.order, ...(e.date ? { date: new Date(e.date) } : {}) },
    })
  ));
  return NextResponse.json({ ok: true });
}
