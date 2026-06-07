import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

const ALLOWED_TYPES = new Set(["Training", "Farrier", "Vet Check", "Custom Tack", "Other"]);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.providerName === "string") data.providerName = body.providerName.trim();
  if (typeof body.serviceType === "string" && ALLOWED_TYPES.has(body.serviceType)) data.serviceType = body.serviceType;
  if (typeof body.price === "string" || body.price === null) data.price = body.price === null ? null : body.price.trim() || null;
  if (typeof body.notes === "string" || body.notes === null) data.notes = body.notes;
  const updated = await prisma.preferredService.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.preferredService.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
