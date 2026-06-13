import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

// Full "backup my stable" export. ?format=json (default) | csv
export async function GET(req: NextRequest) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const format = req.nextUrl.searchParams.get("format") === "csv" ? "csv" : "json";
  const stamp = new Date().toISOString().slice(0, 10);

  const horses = await prisma.horse.findMany({ orderBy: { name: "asc" } });

  if (format === "json") {
    const [pregnancies, breedingPlans] = await Promise.all([
      prisma.pregnancy.findMany(),
      prisma.breedingPlan.findMany(),
    ]);
    const payload = { exportedAt: new Date().toISOString(), counts: { horses: horses.length, pregnancies: pregnancies.length, breedingPlans: breedingPlans.length }, horses, pregnancies, breedingPlans };
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="redfield-stable-backup-${stamp}.json"`,
      },
    });
  }

  // CSV — flat horse rows.
  const cols = [
    "id", "name", "breed", "gender", "coat", "genotype", "sireName", "damName",
    "ownership", "assignedCharacter", "lifeStage", "dob", "microchip", "regNumber",
    "height", "discipline", "personality", "eyeColor", "baseStats", "price",
    "ownerName", "createdAt", "updatedAt",
  ] as const;

  const esc = (v: unknown): string => {
    if (v == null) return "";
    const s = v instanceof Date ? v.toISOString() : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [cols.join(",")];
  for (const h of horses) {
    lines.push(cols.map((c) => esc((h as Record<string, unknown>)[c])).join(","));
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="redfield-stable-backup-${stamp}.csv"`,
    },
  });
}
