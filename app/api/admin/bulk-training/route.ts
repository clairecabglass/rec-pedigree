import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  // [{ id: string, amount: number }]
  if (!Array.isArray(body)) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const updates = body as { id: string; amount: number }[];
  if (updates.length === 0) return NextResponse.json({ updated: 0 });

  await prisma.$transaction(
    updates.map(({ id, amount }) =>
      prisma.horse.update({
        where: { id },
        data: { trainingExp: { increment: Math.max(0, Math.floor(amount)) } },
      })
    )
  );

  return NextResponse.json({ updated: updates.length });
}
