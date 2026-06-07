import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

const ALLOWED_TYPES = new Set(["Training", "Farrier", "Vet Check", "Custom Tack", "Other"]);

export async function GET() {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const services = await prisma.preferredService.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const providerName = typeof body.providerName === "string" ? body.providerName.trim() : "";
  const serviceType = ALLOWED_TYPES.has(body.serviceType) ? body.serviceType : "Other";
  const priceCents = Number.isFinite(body.priceCents) ? Math.round(Number(body.priceCents)) : null;
  const notes = typeof body.notes === "string" ? body.notes : null;
  if (!providerName) return NextResponse.json({ error: "providerName required" }, { status: 400 });

  const created = await prisma.preferredService.create({
    data: { providerName, serviceType, priceCents, notes },
  });
  return NextResponse.json(created);
}
