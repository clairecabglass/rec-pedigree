import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";
import SpoonerBuildsClient from "./SpoonerBuildsClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Spooner Builds · Admin · Redfield Equestrian Centre" };

export default async function SpoonerBuildsPage() {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");

  const builds = await prisma.spoonerBuild.findMany({
    include: {
      photos: { orderBy: { order: "asc" } },
      txtFiles: { orderBy: { order: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <SpoonerBuildsClient
      initialBuilds={builds.map((b) => ({
        ...b,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
        photos: b.photos.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })),
        txtFiles: b.txtFiles.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
      }))}
    />
  );
}
