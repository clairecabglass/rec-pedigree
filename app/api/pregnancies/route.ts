import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

export async function GET() {
  const pregnancies = await prisma.pregnancy.findMany({ orderBy: { dueDate: "asc" } });
  return NextResponse.json(pregnancies);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { damId, sireName, dueDate, coverDate, foalName, foalGender } = body;

  const dam = damId ? await prisma.horse.findUnique({ where: { id: damId } }) : null;
  if (!dam) return NextResponse.json({ error: "Select a valid mare" }, { status: 400 });

  // Create the placeholder foal (a real Horse so it gets a page + pedigree).
  const base = (foalName?.trim() as string) || `Foal of ${dam.name}`;
  let name = base;
  let n = 2;
  while (await prisma.horse.findUnique({ where: { name } })) name = `${base} (${n++})`;

  const foal = await prisma.horse.create({
    data: {
      name,
      sireName: sireName || null,
      damName: dam.name,
      breed: dam.breed,
      gender: foalGender || null,
      ownership: "Expected",
      notes: "Auto-created foal placeholder from the breeding tracker.",
    },
  });

  const pregnancy = await prisma.pregnancy.create({
    data: {
      damId,
      sireName: sireName || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      coverDate: coverDate ? new Date(coverDate) : null,
      foalId: foal.id,
      status: "expecting",
    },
  });

  return NextResponse.json({ ok: true, pregnancy, foal }, { status: 201 });
}
