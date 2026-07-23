import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const players = await prisma.player.findMany({ orderBy: { ign: "asc" } });
  return NextResponse.json(players);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const player = await prisma.player.create({
    data: {
      ign:          body.ign?.trim() || "",
      username:     body.username?.trim() || "",
      stableName:   body.stableName?.trim() || null,
      stablePrefix: body.stablePrefix?.trim() || null,
      notes:        body.notes?.trim() || null,
    },
  });
  return NextResponse.json(player, { status: 201 });
}
