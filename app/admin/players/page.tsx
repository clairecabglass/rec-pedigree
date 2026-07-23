import { isAdminLoggedIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import PlayersClient from "./PlayersClient";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");

  const players = await prisma.player.findMany({ orderBy: { ign: "asc" } });

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div style={{ marginBottom: 20 }}>
        <Link href="/admin" style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none", fontFamily: "var(--font-lato)" }}>
          ← Admin
        </Link>
      </div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 32, color: "var(--teal-dark)", margin: 0, marginBottom: 6 }}>
          Players
        </h1>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
          Player directory — IGN, username, and stable info. Used to auto-fill buyer / owner fields on documents.
        </p>
      </div>
      <PlayersClient initial={players.map(p => ({
        id: p.id,
        ign: p.ign,
        username: p.username,
        stableName: p.stableName,
        stablePrefix: p.stablePrefix,
        notes: p.notes,
      }))} />
    </div>
  );
}
