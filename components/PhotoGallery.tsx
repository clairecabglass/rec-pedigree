"use client";
import { useState, useEffect } from "react";

export interface GalleryPhoto { id: string; url: string; caption: string | null; }

export default function PhotoGallery({ photos }: { photos: GalleryPhoto[] }) {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % photos.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, photos.length]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((p, i) => (
          <button key={p.id} onClick={() => setOpen(i)}
            style={{ border: "3px solid var(--gold-light)", borderRadius: 8, overflow: "hidden", padding: 0, cursor: "pointer", background: "var(--cream-dark)", aspectRatio: "4/3" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={p.caption ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          onClick={() => setOpen(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(20,28,27,0.88)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
        >
          <button onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + photos.length) % photos.length); }}
            style={lightboxArrow("left")} aria-label="Previous">‹</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[open].url} alt={photos[open].caption ?? ""} onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 6, boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }} />
          <button onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % photos.length); }}
            style={lightboxArrow("right")} aria-label="Next">›</button>
          <button onClick={() => setOpen(null)} style={{ position: "fixed", top: 20, right: 24, background: "none", border: "none", color: "white", fontSize: 30, cursor: "pointer", lineHeight: 1 }} aria-label="Close">✕</button>
          {photos.length > 1 && (
            <div style={{ position: "fixed", bottom: 20, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "var(--font-lato)" }}>
              {open + 1} / {photos.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function lightboxArrow(side: "left" | "right"): React.CSSProperties {
  return {
    position: "fixed", [side]: 16, top: "50%", transform: "translateY(-50%)",
    width: 46, height: 46, borderRadius: "50%", border: "none",
    background: "rgba(255,255,255,0.9)", color: "var(--teal-dark)", fontSize: 26,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, zIndex: 101,
  };
}
