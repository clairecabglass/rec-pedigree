import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const horse = await prisma.horse.findUnique({ where: { id } });
  if (!horse) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(horse);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const horse = await prisma.horse.update({ where: { id }, data: body });
  return NextResponse.json(horse);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.horse.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
