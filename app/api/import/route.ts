import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const ws = wb.Sheets["Registry"] ?? wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: null });

  const horses = rows
    .filter((r) => {
      const name = r["NAME"] ?? r["name"];
      if (!name || typeof name !== "string") return false;
      if (name.startsWith("---") || name.startsWith("--") || name === "// EXAMPLE") return false;
      return true;
    })
    .map((r) => {
      const microchip = r["MICROCHIP"] ?? r["microchip"];
      return {
        microchip: microchip && microchip !== "FULL PEDIGREE" && microchip !== "nan" ? String(microchip).trim() : null,
        name: String(r["NAME"] ?? r["name"]).trim(),
        breed: r["BREED"] ? String(r["BREED"]).trim() : null,
        gender: r["GENDER"] ? String(r["GENDER"]).trim() : null,
        sireName: r["SIRE"] ? String(r["SIRE"]).trim() : null,
        damName: r["DAM"] ? String(r["DAM"]).trim() : null,
        coat: r["COAT"] ? String(r["COAT"]).trim() : null,
        withFoal: r["WITH FOAL"] === 1,
        ownership: r["OWNERSHIP"] ? String(r["OWNERSHIP"]).trim() : null,
        notes: r["EXTENDED NOTES"] ? String(r["EXTENDED NOTES"]).trim() : null,
        dob: r["DOB"] instanceof Date ? r["DOB"] : null,
      };
    });

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const h of horses) {
    try {
      const existing = await prisma.horse.findUnique({ where: { name: h.name } });
      if (existing) {
        await prisma.horse.update({ where: { name: h.name }, data: h });
        updated++;
      } else {
        await prisma.horse.create({ data: h });
        created++;
      }
    } catch {
      errors++;
    }
  }

  return NextResponse.json({ ok: true, created, updated, errors, total: horses.length });
}
