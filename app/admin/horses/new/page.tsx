import { isAdminLoggedIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import HorseForm from "@/components/HorseForm";

export const dynamic = "force-dynamic";

export default async function NewHorsePage() {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <Link href="/admin" style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none", fontFamily: "var(--font-lato)", display: "block", marginBottom: 20 }}>
        ← Back to Admin
      </Link>
      <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 32, color: "var(--teal-dark)", marginBottom: 24 }}>Add Horse</h1>
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, padding: 28 }}>
        <HorseForm mode="create" />
      </div>
    </div>
  );
}
