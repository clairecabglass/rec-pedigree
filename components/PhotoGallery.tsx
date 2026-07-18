"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export interface GalleryPhoto { id: string; url: string; caption: string | null; fill?: boolean; }
export interface GalleryVideo { id: string; url: string; caption: string | null; mimeType: string | null; }

type MediaItem =
  | { kind: "photo"; data: GalleryPhoto }
  | { kind: "video"; data: GalleryVideo };

export default function PhotoGallery({
  photos,
  videos = [],
}: {
  photos: GalleryPhoto[];
  videos?: GalleryVideo[];
}) {
  const items: MediaItem[] = [
    ...photos.map((p) => ({ kind: "photo" as const, data: p })),
    ...videos.map((v) => ({ kind: "video" as const, data: v })),
  ];

  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % items.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + items.length) % items.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, items.length]);

  if (items.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item, i) => (
          <button
            key={item.data.id}
            onClick={() => setOpen(i)}
            style={{
              position: "relative",
              border: "3px solid var(--gold-light)", borderRadius: 8, overflow: "hidden",
              padding: 0, cursor: "pointer", background: "var(--cream-dark)", aspectRatio: "4/3",
            }}
          >
            {item.kind === "photo" ? (
              <Image
                src={item.data.url}
                alt={item.data.caption ?? "Horse photo"}
                fill
                quality={90}
                sizes="(max-width: 640px) 50vw, 33vw"
                style={{ objectFit: "cover" }}
              />
            ) : (
              <VideoThumb url={item.data.url} mimeType={item.data.mimeType} />
            )}
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          onClick={() => setOpen(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(20,28,27,0.88)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
        >
          {items.length > 1 && (
            <button onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + items.length) % items.length); }}
              style={arrowStyle("left")} aria-label="Previous">‹</button>
          )}

          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "85vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {items[open].kind === "photo" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={items[open].data.url}
                alt={items[open].data.caption ?? "Horse photo"}
                style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 6, boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}
              />
            ) : (
              <video
                src={items[open].data.url}
                controls
                autoPlay
                style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 6, boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}
              >
                {items[open].data.mimeType && <source src={items[open].data.url} type={items[open].data.mimeType!} />}
              </video>
            )}
          </div>

          {items.length > 1 && (
            <button onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % items.length); }}
              style={arrowStyle("right")} aria-label="Next">›</button>
          )}
          <button onClick={() => setOpen(null)} style={{ position: "fixed", top: 20, right: 24, background: "none", border: "none", color: "white", fontSize: 30, cursor: "pointer", lineHeight: 1 }} aria-label="Close">✕</button>
          {items.length > 1 && (
            <div style={{ position: "fixed", bottom: 20, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "var(--font-lato)" }}>
              {open + 1} / {items.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function VideoThumb({ url, mimeType }: { url: string; mimeType: string | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#1A1A1A" }}>
      <video
        ref={videoRef}
        src={url}
        muted
        preload="metadata"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).currentTime = 1; }}
      >
        {mimeType && <source src={url} type={mimeType} />}
      </video>
      {/* Play icon overlay */}
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.25)",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.85)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, paddingLeft: 3, color: "#333",
        }}>▶</div>
      </div>
    </div>
  );
}

function arrowStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "fixed", [side]: 16, top: "50%", transform: "translateY(-50%)",
    width: 46, height: 46, borderRadius: "50%", border: "none",
    background: "rgba(255,255,255,0.9)", color: "var(--teal-dark)", fontSize: 26,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, zIndex: 101,
  };
}
