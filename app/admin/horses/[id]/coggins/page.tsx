import { isAdminLoggedIn } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import CogginsClient from "./CogginsClient";

export const dynamic = "force-dynamic";

export default async function CogginsPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");
  const { id } = await params;

  const horse = await prisma.horse.findUnique({
    where: { id },
    select: { id: true, name: true, breed: true, gender: true, dob: true, regNumber: true, coat: true },
  });
  if (!horse) notFound();

  return (
    <CogginsClient
      id={horse.id}
      name={horse.name}
      breed={horse.breed ?? ""}
      gender={horse.gender ?? ""}
      dob={horse.dob ? horse.dob.toISOString().split("T")[0] : ""}
      regNumber={horse.regNumber ?? ""}
      coat={horse.coat ?? ""}
    />
  );
}
