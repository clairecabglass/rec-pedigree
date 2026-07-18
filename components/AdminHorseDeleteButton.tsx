"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Admin-only "Delete Horse" button + confirm modal. Rendered conditionally
 * by the horse profile when the viewer is authenticated as an admin; the
 * server still re-checks auth on the DELETE request, so a stray render
 * cannot bypass the gate.
 */
export default function AdminHorseDeleteButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function confirmDelete() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/horses/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Could not delete this horse.");
      setBusy(false);
      return;
    }
    setOpen(false);
    setBusy(false);
    router.push("/admin");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          color: "#C05050",
          background: "var(--white)",
          border: "1px solid #E07070",
          padding: "7px 16px",
          borderRadius: 6,
          textDecoration: "none",
          fontFamily: "var(--font-lato)",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Delete Horse
      </button>

      {open && (
        <div
          onClick={() => !busy && setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(20,28,27,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--white)", borderRadius: 12, padding: 28, maxWidth: 480, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
          >
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)", marginBottom: 8 }}>
              Delete this horse?
            </h2>
            <p style={{ fontSize: 13, color: "var(--text)", fontFamily: "var(--font-lato)", lineHeight: 1.55, marginBottom: 14 }}>
              Are you absolutely certain you want to permanently delete{" "}
              <strong style={{ color: "var(--teal-dark)" }}>{name}</strong> from the database?
              This action is irreversible — photos, documents, results, and any pedigree references to this horse will be removed too.
            </p>

            {error && (
              <div style={{ background: "#FBECEC", border: "1px solid #E07070", color: "#A24242", padding: "8px 12px", borderRadius: 6, fontSize: 12, fontFamily: "var(--font-lato)", marginBottom: 12 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                style={{ background: "var(--white)", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "8px 16px", borderRadius: 6, fontSize: 13, cursor: busy ? "not-allowed" : "pointer", fontFamily: "var(--font-lato)" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={busy}
                style={{ background: "#C05050", color: "white", border: "none", padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.7 : 1, fontFamily: "var(--font-lato)" }}
              >
                {busy ? "Deleting…" : "Yes, delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
