import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";
import { sanitizeHorseInput } from "@/lib/horseInput";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const ownership = searchParams.get("ownership");

  const microchip = searchParams.get("microchip");

  // Quick existence check — returns { exists: true/false }
  if (microchip) {
    const hit = await prisma.horse.findFirst({ where: { microchip }, select: { id: true } });
    return NextResponse.json({ exists: !!hit });
  }

  const horses = await prisma.horse.findMany({
    where: {
      ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
      ...(ownership ? { ownership } : {}),
    },
    orderBy: { name: "asc" },
    take: 100,
  });
  return NextResponse.json(horses);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const data = sanitizeHorseInput(body);
  if (!data.name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const horse = await prisma.horse.create({ data: data as { name: string } });
  return NextResponse.json(horse, { status: 201 });
}
