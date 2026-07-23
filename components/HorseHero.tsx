"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

export interface HeroPhoto { id: string; url: string; caption: string | null; fill: boolean; }
export interface HeroVideo { id: string; url: string; caption: string | null; mimeType: string | null; }

type Item =
  | { kind: "photo"; data: HeroPhoto }
  | { kind: "video"; data: HeroVideo };

export default function HorseHero({
  photos: initialPhotos,
  videos = [],
  name,
  isAdmin,
}: {
  photos: HeroPhoto[];
  videos?: HeroVideo[];
  name: string;
  isAdmin?: boolean;
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [saving, setSaving] = useState(false);

  const items: Item[] = [
    ...photos.map((p) => ({ kind: "photo" as const, data: p })),
    ...videos.map((v) => ({ kind: "video" as const, data: v })),
  ];
  const count = items.length;
  const current = items[index] ?? items[0];

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + count) % count);

  useEffect(() => {
    if (count < 2 && !lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, lightbox]); // eslint-disable-line

  async function toggleFill(e: React.MouseEvent) {
    if (!current || current.kind !== "photo") return;
    e.stopPropagation();
    const next = !current.data.fill;
    setSaving(true);
    setPhotos((ps) => ps.map((p) => (p.id === current.data.id ? { ...p, fill: next } : p)));
    try {
      const res = await fetch(`/api/photos/${current.data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fill: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setPhotos((ps) => ps.map((p) => (p.id === current.data.id ? { ...p, fill: !next } : p)));
      alert("Could not save the image fit.");
    } finally {
      setSaving(false);
    }
  }

  if (!current) return null;

  return (
    <div style={{ textAlign: "center", marginBottom: 8 }}>
      <div style={{ position: "relative", display: "inline-block", maxWidth: 920, width: "100%" }}>
        <div
          onClick={() => { if (current.kind === "photo") setLightbox(true); }}
          style={{
            position: "relative", height: "min(70vh, 520px)", overflow: "hidden",
            background: "var(--cream-dark)", borderRadius: 8, border: "4px solid var(--gold)",
            boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
            cursor: current.kind === "photo" ? "zoom-in" : "default",
          }}
        >
          {current.kind === "photo" ? (
            <Image
              src={current.data.url}
              alt={current.data.caption ?? name}
              fill
              sizes="(max-width: 960px) 100vw, 920px"
              style={{ objectFit: current.data.fill ? "cover" : "contain" }}
            />
          ) : (
            <video
              key={current.data.id}
              src={current.data.url}
              controls
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            >
              {current.data.mimeType && <source src={current.data.url} type={current.data.mimeType} />}
            </video>
          )}
        </div>

        {isAdmin && current.kind === "photo" && (
          <button
            onClick={toggleFill}
            disabled={saving}
            style={{
              position: "absolute", top: 12, left: 12,
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(20,28,27,0.6)", color: "white", border: "none",
              borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700,
              fontFamily: "var(--font-lato)", cursor: saving ? "wait" : "pointer", zIndex: 2,
            }}
            title={current.data.fill ? "Currently filling the block — click to show the whole image" : "Currently showing the whole image — click to fill the block"}
          >
            {current.data.fill ? "⤡ Fit whole image" : "⤢ Fill block"}
          </button>
        )}

        {count > 1 && (
          <>
            <button onClick={() => go(-1)} style={heroArrow("left")} aria-label="Previous">‹</button>
            <button onClick={() => go(1)}  style={heroArrow("right")} aria-label="Next">›</button>
            <div style={{
              position: "absolute", bottom: 12, right: 12,
              background: "rgba(20,28,27,0.6)", color: "white", fontSize: 12, fontWeight: 700,
              padding: "3px 9px", borderRadius: 999, fontFamily: "var(--font-lato)",
            }}>
              {index + 1} / {count}
            </div>
          </>
        )}
      </div>

      <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-lato)", marginTop: 8 }}>
        {current.kind === "video" ? "Video" : "Click to view full image"}
      </div>

      {lightbox && current.kind === "photo" && (
        <div
          onClick={() => setLightbox(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(20,28,27,0.88)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
        >
          {count > 1 && (
            <button onClick={(e) => { e.stopPropagation(); go(-1); }} style={lightboxArrow("left")} aria-label="Previous">‹</button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.data.url}
            alt={current.data.caption ?? name}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 6, boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}
          />
          {count > 1 && (
            <button onClick={(e) => { e.stopPropagation(); go(1); }} style={lightboxArrow("right")} aria-label="Next">›</button>
          )}
          <button onClick={() => setLightbox(false)} style={{ position: "fixed", top: 20, right: 24, background: "none", border: "none", color: "white", fontSize: 30, cursor: "pointer", lineHeight: 1 }} aria-label="Close">✕</button>
          {count > 1 && (
            <div style={{ position: "fixed", bottom: 20, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "var(--font-lato)" }}>
              {index + 1} / {count}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function heroArrow(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute", [side]: 12, top: "50%", transform: "translateY(-50%)",
    width: 42, height: 42, borderRadius: "50%", border: "none",
    background: "rgba(255,255,255,0.85)", color: "var(--teal-dark)", fontSize: 26, fontWeight: 700,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)", zIndex: 2,
  };
}

function lightboxArrow(side: "left" | "right"): React.CSSProperties {
  return {
    position: "fixed", [side]: 16, top: "50%", transform: "translateY(-50%)",
    width: 46, height: 46, borderRadius: "50%", border: "none",
    background: "rgba(255,255,255,0.9)", color: "var(--teal-dark)", fontSize: 26,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, zIndex: 101,
  };
}
