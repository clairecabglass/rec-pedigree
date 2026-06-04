"use client";
import { useState, useRef } from "react";
import Link from "next/link";

export default function ImportClient() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; updated: number; errors: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith(".xlsx") || f?.name.endsWith(".xls")) setFile(f);
    else setError("Please upload an .xlsx file.");
  }

  async function doImport() {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/import", { method: "POST", body: fd });
    setLoading(false);
    if (!res.ok) {
      setError("Import failed. Check the file format.");
    } else {
      setResult(await res.json());
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <Link href="/admin" style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none", fontFamily: "var(--font-lato)", display: "block", marginBottom: 20 }}>
        ← Back to Admin
      </Link>
      <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 32, color: "var(--teal-dark)", marginBottom: 6 }}>Import Excel</h1>
      <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14, marginBottom: 28 }}>
        Upload your <strong>REC Pedigree.xlsx</strong> to sync the registry. Existing horses (matched by name) will be updated; new horses will be added.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "var(--teal)" : "var(--border)"}`,
          borderRadius: 8,
          padding: "48px 24px",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "var(--teal-muted)" : "var(--cream)",
          transition: "all 0.15s",
          marginBottom: 20,
        }}
      >
        <input ref={inputRef} type="file" accept=".xlsx,.xls" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
        <div style={{ fontSize: 36, marginBottom: 8 }}>📤</div>
        {file ? (
          <div>
            <div style={{ fontWeight: 600, color: "var(--teal-dark)", fontFamily: "var(--font-lato)", fontSize: 15 }}>{file.name}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>{(file.size / 1024).toFixed(0)} KB — click to change</div>
          </div>
        ) : (
          <div>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 15, color: "var(--text-muted)", marginBottom: 4 }}>Drag & drop your .xlsx file here</div>
            <div style={{ fontSize: 13, color: "var(--border)", fontFamily: "var(--font-lato)" }}>or click to browse</div>
          </div>
        )}
      </div>

      {error && <div style={{ color: "#C05050", fontFamily: "var(--font-lato)", fontSize: 13, marginBottom: 12 }}>{error}</div>}

      <button
        onClick={doImport}
        disabled={!file || loading}
        style={{
          background: file && !loading ? "var(--teal)" : "var(--border)",
          color: "var(--white)", border: "none", borderRadius: 6, padding: "12px 28px",
          fontSize: 14, fontWeight: 700, cursor: file && !loading ? "pointer" : "not-allowed",
          fontFamily: "var(--font-lato)", letterSpacing: "0.05em",
        }}
      >
        {loading ? "Importing…" : "Import"}
      </button>

      {result && (
        <div style={{ marginTop: 24, background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, padding: 24 }}>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: 20, color: "var(--teal-dark)", marginBottom: 16 }}>Import Complete</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, fontFamily: "var(--font-lato)" }}>
            {[
              { label: "Total Processed", value: result.total, color: "var(--teal)" },
              { label: "Added", value: result.created, color: "#4CAF50" },
              { label: "Updated", value: result.updated, color: "var(--gold)" },
              { label: "Errors", value: result.errors, color: result.errors > 0 ? "#E07070" : "var(--text-muted)" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center", background: "var(--cream)", borderRadius: 6, padding: "12px 8px" }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: "var(--font-playfair)" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <Link href="/registry" style={{ display: "inline-block", marginTop: 16, color: "var(--teal)", fontSize: 13, fontFamily: "var(--font-lato)", textDecoration: "none" }}>
            View updated registry →
          </Link>
        </div>
      )}
    </div>
  );
}
