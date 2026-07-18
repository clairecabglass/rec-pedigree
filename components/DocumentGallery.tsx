"use client";
import { useState } from "react";

interface Doc { id: string; url: string; label: string; type: string | null; }

function docKind(d: Doc): "image" | "pdf" | "other" {
  const t = (d.type ?? "").toLowerCase();
  const ext = d.url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (t.includes("image") || ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
  if (t.includes("pdf") || ext === "pdf") return "pdf";
  return "other";
}

export default function DocumentGallery({ docs }: { docs: Doc[] }) {
  const [selected, setSelected] = useState<Doc | null>(null);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {docs.map((d) => {
          const kind = docKind(d);
          return (
            <button
              key={d.id}
              onClick={() => kind !== "other" ? setSelected(d) : window.open(d.url, "_blank")}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                border: "1px solid var(--border)", borderRadius: 8,
                padding: kind === "image" ? "8px 14px 8px 8px" : "10px 14px",
                background: "var(--cream)", textDecoration: "none",
                fontFamily: "var(--font-lato)", cursor: "pointer",
                textAlign: "left", width: "100%",
              }}
            >
              {kind === "image" && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={d.url} alt={d.label} style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 6, flexShrink: 0, border: "1px solid var(--border)" }} />
              )}
              {kind === "pdf" && (
                <span style={{ fontSize: 26, flexShrink: 0, lineHeight: 1 }}>📄</span>
              )}
              {kind === "other" && (
                <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>📎</span>
              )}
              <span style={{ flex: 1, color: "var(--teal-dark)", fontWeight: 600, fontSize: 13 }}>{d.label}</span>
              {d.type && (
                <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--white)", borderRadius: 10, padding: "2px 8px", flexShrink: 0 }}>
                  {d.type}
                </span>
              )}
              {kind !== "other" && (
                <span style={{ fontSize: 11, color: "var(--teal)", flexShrink: 0 }}>Preview →</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--white)", borderRadius: 12, overflow: "hidden", maxWidth: "92vw", maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
              <span style={{ fontFamily: "var(--font-lato)", fontWeight: 700, fontSize: 13, color: "var(--teal-dark)" }}>{selected.label}</span>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <a href={selected.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--teal)", fontFamily: "var(--font-lato)", textDecoration: "none" }}>
                  Open in new tab ↗
                </a>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ overflow: "auto", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#F4F4F2" }}>
              {docKind(selected) === "image" ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={selected.url} alt={selected.label} style={{ maxWidth: "100%", maxHeight: "80vh", display: "block", objectFit: "contain" }} />
              ) : (
                <iframe src={selected.url} style={{ width: "80vw", height: "80vh", border: "none", display: "block" }} title={selected.label} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
