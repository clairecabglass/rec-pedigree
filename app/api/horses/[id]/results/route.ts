import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  if (!body.event?.trim()) return NextResponse.json({ error: "Event is required" }, { status: 400 });
  const result = await prisma.result.create({
    data: {
      horseId: id,
      event: body.event.trim(),
      placement: body.placement?.trim() || null,
      notes: body.notes?.trim() || null,
      date: body.date ? new Date(body.date) : null,
    },
  });
  return NextResponse.json({ ok: true, result }, { status: 201 });
}
