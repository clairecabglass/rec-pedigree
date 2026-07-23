"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

interface HistoryEntry {
  id: string;
  sireName: string | null;
  damId: string;
  damName: string | null;
  foalId: string | null;
  foalName: string | null;
  coverDate: string | null;
  status: string;
  notes: string | null;
}

export default function BreedingHistory({
  horseName,
  entries,
}: {
  horseName: string;
  entries: HistoryEntry[];
}) {
  const [open, setOpen] = useState(false);

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("en-GB") : null;

  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px", background: "none", border: "none", cursor: "pointer",
          fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)", textAlign: "left",
        }}
      >
        <span>Breeding History <span style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: "var(--text-muted)", fontWeight: 400 }}>({entries.length} record{entries.length !== 1 ? "s" : ""})</span></span>
        <ChevronDown size={20} color="var(--teal)" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{ padding: "0 24px 24px", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
            {entries.map((e) => {
              const isDam = e.sireName !== null || e.damName === null;
              return (
                <div key={e.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px", background: "var(--cream)", fontFamily: "var(--font-lato)", fontSize: 13 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
                    {/* Cover date */}
                    {e.coverDate && (
                      <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {fmt(e.coverDate)}
                      </span>
                    )}

                    {/* Partner info */}
                    <span style={{ flex: 1, color: "var(--text)" }}>
                      {e.sireName && horseName.toLowerCase() !== e.sireName.toLowerCase() ? (
                        <>By <strong style={{ color: "var(--sire-text)" }}>{e.sireName}</strong></>
                      ) : e.damName ? (
                        <>Out of <strong style={{ color: "var(--dam-text)" }}>{e.damName}</strong></>
                      ) : null}
                    </span>

                    {/* Status badge */}
                    <span style={{
                      background: e.status === "born" ? "var(--teal-muted)" : "#FFF3D0",
                      color: e.status === "born" ? "var(--teal-dark)" : "#7A5C00",
                      borderRadius: 10, padding: "2px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
                    }}>
                      {e.status === "born" ? "Born" : "Expecting"}
                    </span>
                  </div>

                  {/* Foal */}
                  {e.foalId && e.foalName && (
                    <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-muted)" }}>
                      Foal:{" "}
                      <Link href={`/registry/${e.foalId}`} style={{ color: "var(--teal-dark)", fontWeight: 700, textDecoration: "none" }}>
                        {e.foalName}
                      </Link>
                    </div>
                  )}

                  {/* Notes */}
                  {e.notes && (
                    <div style={{ marginTop: 4, fontSize: 12, color: "var(--text-muted)", whiteSpace: "pre-wrap" }}>{e.notes}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
