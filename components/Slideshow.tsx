"use client";
import { useState } from "react";

export interface SlidePhoto { id: string; url: string; caption: string | null; }

export default function Slideshow({ photos }: { photos: SlidePhoto[] }) {
  const [i, setI] = useState(0);
  if (!photos.length) return null;

  const cur = photos[i];
  const go = (d: number) => setI((p) => (p + d + photos.length) % photos.length);

  return (
    <div>
      <div style={{ position: "relative", width: "100%", paddingTop: "70%", background: "var(--cream-dark)", borderRadius: 10, overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cur.url} alt={cur.caption ?? ""} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />

        {photos.length > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Previous" style={arrowStyle("left")}>‹</button>
            <button onClick={() => go(1)} aria-label="Next" style={arrowStyle("right")}>›</button>
            <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
              {photos.map((_, idx) => (
                <button key={idx} onClick={() => setI(idx)} aria-label={`Photo ${idx + 1}`}
                  style={{ width: 8, height: 8, borderRadius: "50%", border: "none", cursor: "pointer", background: idx === i ? "var(--white)" : "rgba(255,255,255,0.5)" }} />
              ))}
            </div>
          </>
        )}
        {cur.caption && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.55))", color: "white", padding: "20px 14px 10px", fontSize: 12, fontFamily: "var(--font-lato)" }}>
            {cur.caption}
          </div>
        )}
      </div>

      {photos.length > 1 && (
        <div style={{ display: "flex", gap: 6, marginTop: 8, overflowX: "auto", paddingBottom: 4 }}>
          {photos.map((p, idx) => (
            <button key={p.id} onClick={() => setI(idx)} style={{ flexShrink: 0, width: 56, height: 42, borderRadius: 5, overflow: "hidden", border: idx === i ? "2px solid var(--teal)" : "1px solid var(--border)", padding: 0, cursor: "pointer", background: "none" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function arrowStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute", top: "50%", [side]: 8, transform: "translateY(-50%)",
    width: 34, height: 34, borderRadius: "50%", border: "none",
    background: "rgba(255,255,255,0.85)", color: "var(--teal-dark)", fontSize: 20,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    lineHeight: 1, boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
  };
}
