import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

export async function GET() {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const plans = await prisma.herdPlan.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json(plans);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const plan = await prisma.herdPlan.create({
    data: {
      title:  body.title  ?? "Untitled Plan",
      status: body.status ?? "active",
      goal:   body.goal   ?? {},
      tree:   body.tree   ?? null,
      notes:  body.notes  ?? null,
    },
  });
  return NextResponse.json(plan);
}
