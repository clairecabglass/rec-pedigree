import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

export async function GET() {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const plans = await prisma.breedingPlan.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(plans);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.damId || !body.damName) return NextResponse.json({ error: "Mare required" }, { status: 400 });
  const plan = await prisma.breedingPlan.create({
    data: {
      damId: body.damId, damName: body.damName,
      sireId: body.sireId || null, sireName: body.sireName || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json({ ok: true, plan }, { status: 201 });
}
