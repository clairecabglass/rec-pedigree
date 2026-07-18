import { isAdminLoggedIn } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { readFile } from "fs/promises";
import path from "path";
import GeneticsCertClient from "./GeneticsCertClient";

export const dynamic = "force-dynamic";

export default async function GeneticsCertPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");
  const { id } = await params;

  const horse = await prisma.horse.findUnique({
    where: { id },
    select: { id: true, name: true, breed: true, gender: true, dob: true, regNumber: true, genotype: true, coat: true },
  });
  if (!horse) notFound();

  async function toDataUri(filename: string) {
    try {
      const buf = await readFile(path.join(process.cwd(), "public/brand", filename));
      const ext = filename.split(".").pop() ?? "png";
      return `data:image/${ext};base64,${buf.toString("base64")}`;
    } catch { return ""; }
  }

  const [sigBreeder, sigLab] = await Promise.all([
    toDataUri("signature.png"),
    toDataUri("lab-analyst.png"),
  ]);

  return (
    <GeneticsCertClient
      id={horse.id}
      name={horse.name}
      breed={horse.breed ?? ""}
      gender={horse.gender ?? ""}
      dob={horse.dob ? horse.dob.toISOString().split("T")[0] : ""}
      regNumber={horse.regNumber ?? ""}
      genotype={horse.genotype ?? ""}
      coat={horse.coat ?? ""}
      sigBreeder={sigBreeder}
      sigLab={sigLab}
    />
  );
}
