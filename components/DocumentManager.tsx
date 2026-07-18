"use client";
import { useState, useRef } from "react";
import Icon from "./Icon";

export interface DocItem {
  id: string;
  url: string;
  label: string;
  type: string | null;
}

const TYPES = ["Vet record", "Registration", "Health certificate", "Other"];

export default function DocumentManager({ horseId, initial }: { horseId: string; initial: DocItem[] }) {
  const [docs, setDocs] = useState<DocItem[]>(initial);
  const [label, setLabel] = useState("");
  const [type, setType] = useState(TYPES[0]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("label", label || file.name);
    fd.append("type", type);
    const res = await fetch(`/api/horses/${horseId}/documents`, { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) { const j = await res.json().catch(() => ({})); setError(j.error || "Upload failed."); return; }
    const { doc } = await res.json();
    setDocs((prev) => [...prev, doc]);
    setLabel("");
  }

  async function remove(id: string) {
    if (!confirm("Delete this document?")) return;
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  const inputStyle = { border: "1px solid var(--border)", borderRadius: 6, padding: "8px 10px", fontSize: 13, fontFamily: "var(--font-lato)", outline: "none", background: "var(--white)" };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (e.g. 2026 Coggins)" style={{ ...inputStyle, flex: 1, minWidth: 160 }} />
        <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <input ref={inputRef} type="file" accept=".pdf,image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--teal)", color: "white", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-lato)" }}>
          <Icon name="upload" size={15} color="white" /> {uploading ? "Uploading…" : "Upload"}
        </button>
      </div>

      {error && <div style={{ color: "#C05050", fontSize: 13, marginBottom: 10, fontFamily: "var(--font-lato)" }}>{error}</div>}

      {docs.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: 13, fontFamily: "var(--font-lato)" }}>No documents attached.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {docs.map((d) => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--border)", borderRadius: 6, padding: "8px 12px", background: "var(--white)", fontFamily: "var(--font-lato)" }}>
              <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, color: "var(--teal-dark)", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                {d.label}
              </a>
              {d.type && <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--cream)", borderRadius: 10, padding: "2px 8px" }}>{d.type}</span>}
              <button type="button" onClick={() => remove(d.id)} style={{ border: "none", background: "none", color: "#C05050", cursor: "pointer", fontSize: 13 }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
