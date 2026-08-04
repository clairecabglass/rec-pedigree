import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const plan = await prisma.herdPlan.findUnique({ where: { id } });
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(plan);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const plan = await prisma.herdPlan.update({
    where: { id },
    data: {
      ...(body.title  !== undefined && { title:  body.title }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.goal   !== undefined && { goal:   body.goal }),
      ...(body.tree   !== undefined && { tree:   body.tree }),
      ...(body.notes  !== undefined && { notes:  body.notes }),
      updatedAt: new Date(),
    },
  });
  return NextResponse.json(plan);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.herdPlan.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
