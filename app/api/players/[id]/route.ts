import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const player = await prisma.player.update({
    where: { id },
    data: {
      ign:          body.ign?.trim() || "",
      username:     body.username?.trim() || "",
      stableName:   body.stableName?.trim() || null,
      stablePrefix: body.stablePrefix?.trim() || null,
      notes:        body.notes?.trim() || null,
    },
  });
  return NextResponse.json(player);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.player.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
