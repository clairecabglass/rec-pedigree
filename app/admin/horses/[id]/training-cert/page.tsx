import { isAdminLoggedIn } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { readFile } from "fs/promises";
import path from "path";
import TrainingCertClient from "./TrainingCertClient";

export const dynamic = "force-dynamic";

export default async function TrainingCertPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");
  const { id } = await params;

  const horse = await prisma.horse.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!horse) notFound();

  let templateDataUri = "";
  try {
    const buf = await readFile(path.join(process.cwd(), "public/brand", "REC Training Cert No Name.png"));
    templateDataUri = `data:image/png;base64,${buf.toString("base64")}`;
  } catch { /* template not found */ }

  return (
    <TrainingCertClient
      id={horse.id}
      name={horse.name}
      templateDataUri={templateDataUri}
    />
  );
}
