"use client";
import { useState, useEffect } from "react";

export interface HeroPhoto { id: string; url: string; caption: string | null; fill: boolean; }

export default function HorseHero({ photos: initial, name, isAdmin }: { photos: HeroPhoto[]; name: string; isAdmin?: boolean }) {
  const [photos, setPhotos] = useState(initial);
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [saving, setSaving] = useState(false);
  const count = photos.length;

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + count) % count);

  // Arrow keys: navigate the lightbox when open, the hero otherwise.
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

  const current = photos[index];

  async function toggleFill(e: React.MouseEvent) {
    e.stopPropagation();
    const next = !current.fill;
    setSaving(true);
    // Optimistic update
    setPhotos((ps) => ps.map((p, i) => (i === index ? { ...p, fill: next } : p)));
    try {
      const res = await fetch(`/api/photos/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fill: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on failure
      setPhotos((ps) => ps.map((p, i) => (i === index ? { ...p, fill: !next } : p)));
      alert("Could not save the image fit.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ textAlign: "center", marginBottom: 8 }}>
      <div style={{ position: "relative", display: "inline-block", maxWidth: 920, width: "100%" }}>
        {/* Fixed-height frame holds the border/background; the image sits inside.
            Fit mode renders the image at its natural size (max 100%) so it's
            never upscaled/pixelated; fill mode stretches it to cover the frame
            (an intentional crop chosen by the admin). */}
        <div
          onClick={() => setLightbox(true)}
          style={{ height: "min(70vh, 520px)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "var(--cream-dark)", borderRadius: 8, border: "4px solid var(--gold)", boxShadow: "0 6px 20px rgba(0,0,0,0.12)", cursor: "zoom-in" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.url}
            alt={current.caption ?? name}
            style={current.fill
              ? { width: "100%", height: "100%", objectFit: "cover", display: "block" }
              : { maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
          />
        </div>

        {/* Admin: toggle fill vs fit for this photo */}
        {isAdmin && (
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
            title={current.fill ? "Currently filling the block — click to show the whole image" : "Currently showing the whole image — click to fill the block"}
          >
            {current.fill ? "⤡ Fit whole image" : "⤢ Fill block"}
          </button>
        )}

        {count > 1 && (
          <>
            <button onClick={() => go(-1)} style={heroArrow("left")} aria-label="Previous photo">‹</button>
            <button onClick={() => go(1)}  style={heroArrow("right")} aria-label="Next photo">›</button>
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
        Click to view full image
      </div>

      {/* Fullscreen lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(20,28,27,0.88)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
        >
          {count > 1 && (
            <button onClick={(e) => { e.stopPropagation(); go(-1); }} style={lightboxArrow("left")} aria-label="Previous">‹</button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.url}
            alt={current.caption ?? name}
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
