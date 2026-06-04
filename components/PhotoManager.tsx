"use client";
import { useState, useRef } from "react";
import Icon from "./Icon";

export interface PhotoItem {
  id: string;
  url: string;
  caption: string | null;
  order: number;
  isPrimary: boolean;
}

export default function PhotoManager({ horseId, initial }: { horseId: string; initial: PhotoItem[] }) {
  const [photos, setPhotos] = useState<PhotoItem[]>(
    [...initial].sort((a, b) => a.order - b.order)
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    setError("");
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    const res = await fetch(`/api/horses/${horseId}/photos`, { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) { setError("Upload failed."); return; }
    const { created } = await res.json();
    setPhotos((prev) => [...prev, ...created].sort((a, b) => a.order - b.order));
  }

  async function makePrimary(id: string) {
    await fetch(`/api/photos/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ makePrimary: true }),
    });
    setPhotos((prev) => prev.map((p) => ({ ...p, isPrimary: p.id === id })));
  }

  async function remove(id: string) {
    if (!confirm("Delete this photo?")) return;
    await fetch(`/api/photos/${id}`, { method: "DELETE" });
    setPhotos((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      if (!filtered.some((p) => p.isPrimary) && filtered[0]) filtered[0].isPrimary = true;
      return [...filtered];
    });
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = photos.findIndex((p) => p.id === id);
    const swap = idx + dir;
    if (swap < 0 || swap >= photos.length) return;
    const next = [...photos];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setPhotos(next);
    await fetch(`/api/photos/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: next.map((p) => p.id) }),
    });
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files); }}
        style={{
          border: "2px dashed var(--border)", borderRadius: 8, padding: "20px",
          textAlign: "center", cursor: "pointer", background: "var(--cream)", marginBottom: 16,
        }}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple hidden
          onChange={(e) => upload(e.target.files)} />
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
          <Icon name="upload" size={24} color="var(--teal)" />
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
          {uploading ? "Uploading…" : "Drag & drop photos here, or click to browse"}
        </div>
      </div>

      {error && <div style={{ color: "#C05050", fontSize: 13, marginBottom: 10, fontFamily: "var(--font-lato)" }}>{error}</div>}

      {photos.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: 13, fontFamily: "var(--font-lato)" }}>No photos yet.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
          {photos.map((p, i) => (
            <div key={p.id} style={{ border: p.isPrimary ? "2px solid var(--teal)" : "1px solid var(--border)", borderRadius: 8, overflow: "hidden", background: "var(--white)" }}>
              <div style={{ position: "relative", paddingTop: "75%", background: "var(--cream-dark)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                {p.isPrimary && (
                  <span style={{ position: "absolute", top: 6, left: 6, background: "var(--teal)", color: "white", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10, fontFamily: "var(--font-lato)", letterSpacing: "0.05em" }}>
                    PRIMARY
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 2, padding: 6, fontFamily: "var(--font-lato)" }}>
                <button type="button" onClick={() => move(p.id, -1)} disabled={i === 0}
                  style={btn(i === 0)} title="Move left">←</button>
                <button type="button" onClick={() => move(p.id, 1)} disabled={i === photos.length - 1}
                  style={btn(i === photos.length - 1)} title="Move right">→</button>
                <button type="button" onClick={() => makePrimary(p.id)} disabled={p.isPrimary}
                  style={{ ...btn(p.isPrimary), flex: 1 }} title="Set as primary">★</button>
                <button type="button" onClick={() => remove(p.id)}
                  style={{ ...btn(false), color: "#C05050" }} title="Delete">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function btn(disabled: boolean): React.CSSProperties {
  return {
    border: "1px solid var(--border)", borderRadius: 4, background: "var(--white)",
    padding: "3px 0", fontSize: 12, cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.35 : 1, minWidth: 26, color: "var(--text)",
  };
}
