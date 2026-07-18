import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

export async function PUT(req: Request) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  await prisma.siteContent.upsert({
    where: { key: "homepage" },
    update: { value: JSON.stringify(body) },
    create: { key: "homepage", value: JSON.stringify(body) },
  });
  return NextResponse.json({ ok: true });
}
