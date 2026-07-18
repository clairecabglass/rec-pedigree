"use client";
import { useState, useRef, FormEvent, ChangeEvent } from "react";
import Link from "next/link";
import { HorseData, AncestorData } from "@/lib/types";
import { PedigreeReviewForm } from "@/components/PedigreeReviewForm";
import { AncestorReviewList } from "@/components/AncestorReviewList";

type Tab = "ocr" | "json";

const cardStyle = { background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, padding: 28 };
const btnStyle: React.CSSProperties = {
  background: "var(--teal)", color: "var(--white)", border: "none", borderRadius: 6,
  padding: "11px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer",
  fontFamily: "var(--font-lato)",
};
const secondaryBtn: React.CSSProperties = {
  background: "var(--white)", border: "1px solid var(--border)", borderRadius: 6,
  padding: "11px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer",
  fontFamily: "var(--font-lato)", color: "var(--teal-dark)",
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, letterSpacing: "0.1em", color: "var(--text-muted)",
  textTransform: "uppercase", fontFamily: "var(--font-lato)", fontWeight: 600,
  display: "block", marginBottom: 4,
};

export default function PedigreeImportPage() {
  const [tab, setTab] = useState<Tab>("json");

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link href="/admin" style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none", fontFamily: "var(--font-lato)", display: "block", marginBottom: 20 }}>
        ← Back to Admin
      </Link>
      <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 32, color: "var(--teal-dark)", marginBottom: 6 }}>Import Horses</h1>
      <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14, marginBottom: 24 }}>
        Import horses from a Rift Trails backup JSON file, or upload a pedigree image to extract data via OCR.
      </p>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "2px solid var(--border)" }}>
        {([["json", "↓ Import JSON"], ["ocr", "🖼 Pedigree Image OCR"]] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            fontFamily: "var(--font-lato)", fontSize: 13, fontWeight: tab === t ? 700 : 400,
            color: tab === t ? "var(--teal-dark)" : "var(--text-muted)",
            background: "none", border: "none", borderBottom: tab === t ? "2px solid var(--teal)" : "2px solid transparent",
            marginBottom: -2, padding: "10px 20px", cursor: "pointer",
          }}>{label}</button>
        ))}
      </div>

      {tab === "json" ? <JsonImport /> : <OcrImport />}
    </div>
  );
}

/* ============================================================
   JSON IMPORT TAB
   ============================================================ */
interface ImportResult {
  total: number; created: number; updated: number; skipped: number;
  errors: number; errorDetails?: string[];
}

function JsonImport() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith(".json")) { setFile(f); setError(""); }
    else setError("Please upload a .json file.");
  }

  async function doImport() {
    if (!file) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const text = await file.text();
      const body = JSON.parse(text);
      const res = await fetch("/api/admin/json-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const j = await res.json(); setError(j.error ?? "Import failed."); }
      else setResult(await res.json());
    } catch {
      setError("Could not read or parse the file. Make sure it's a valid JSON file.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={cardStyle}>
      <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 20, color: "var(--teal-dark)", marginBottom: 8 }}>Import from JSON</h2>
      <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-lato)", marginBottom: 20, lineHeight: 1.6 }}>
        Upload a <strong>Rift Trails backup</strong> (.json) or a single-horse pedigree export. Horses already in your registry will only have <em>blank</em> fields filled in — existing data is never overwritten. New horses are added as <strong>Outside</strong> unless their status is Active.
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "var(--teal)" : "var(--border)"}`,
          borderRadius: 8, padding: "44px 24px", textAlign: "center", cursor: "pointer",
          background: dragging ? "var(--teal-muted)" : "var(--cream)",
          transition: "all 0.15s", marginBottom: 16,
        }}
      >
        <input ref={inputRef} type="file" accept=".json" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setError(""); } }} />
        <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
        {file ? (
          <>
            <div style={{ fontWeight: 700, color: "var(--teal-dark)", fontFamily: "var(--font-lato)", fontSize: 15 }}>{file.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>{(file.size / 1024).toFixed(0)} KB — click to change</div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 15, color: "var(--text-muted)", marginBottom: 4 }}>Drag & drop your .json file here</div>
            <div style={{ fontSize: 12, color: "var(--border)", fontFamily: "var(--font-lato)" }}>or click to browse</div>
          </>
        )}
      </div>

      {error && <p style={{ color: "#C05050", fontFamily: "var(--font-lato)", fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <button onClick={doImport} disabled={!file || loading} style={{ ...btnStyle, opacity: !file || loading ? 0.5 : 1, cursor: !file || loading ? "not-allowed" : "pointer" }}>
        {loading ? "Importing…" : "Import Horses"}
      </button>

      {result && (
        <div style={{ marginTop: 24, background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 8, padding: 20 }}>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "var(--teal-dark)", marginBottom: 14 }}>Import Complete</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, fontFamily: "var(--font-lato)", marginBottom: 14 }}>
            {[
              { label: "Total", value: result.total, color: "var(--teal)" },
              { label: "Added", value: result.created, color: "#5A9E6A" },
              { label: "Updated", value: result.updated, color: "var(--gold)" },
              { label: "Skipped", value: result.skipped, color: "var(--text-muted)" },
              { label: "Errors", value: result.errors, color: result.errors > 0 ? "#C05050" : "var(--text-muted)" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center", background: "var(--white)", borderRadius: 6, padding: "10px 6px" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "var(--font-playfair)" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
              </div>
            ))}
          </div>
          {result.errorDetails && result.errorDetails.length > 0 && (
            <div style={{ fontSize: 12, color: "#C05050", fontFamily: "var(--font-lato)", lineHeight: 1.6 }}>
              <strong>Errors:</strong>
              <ul style={{ marginTop: 4, paddingLeft: 16 }}>
                {result.errorDetails.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
          <Link href="/registry" style={{ display: "inline-block", marginTop: 8, color: "var(--teal)", fontSize: 13, fontFamily: "var(--font-lato)", textDecoration: "none" }}>
            View updated registry →
          </Link>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   OCR IMPORT TAB
   ============================================================ */
function OcrImport() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<{
    imageUrl: string; imageKey: string;
    rootHorse: HorseData; ancestors: AncestorData[];
  } | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) { setFile(e.target.files[0]); setReviewData(null); setError(null); }
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) { setError("Please select an image file."); return; }
    setLoading(true); setError(null);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await fetch("/api/admin/pedigree-import", { method: "POST", body: formData });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to process image."); }
      setReviewData(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleRootHorseChange = (key: keyof HorseData, value: string | boolean) => {
    if (reviewData) setReviewData((p) => ({ ...p!, rootHorse: { ...p!.rootHorse, [key]: value } }));
  };

  const handleAncestorChange = (index: number, key: keyof AncestorData, value: string | boolean) => {
    if (reviewData) {
      const updated = [...reviewData.ancestors];
      updated[index] = { ...updated[index], [key]: value };
      setReviewData((p) => ({ ...p!, ancestors: updated }));
    }
  };

  return (
    <div style={cardStyle}>
      <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 20, color: "var(--teal-dark)", marginBottom: 8 }}>Pedigree Image OCR</h2>
      <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-lato)", marginBottom: 20, lineHeight: 1.6 }}>
        Upload a screenshot of a pedigree to extract horse names and details automatically. Review the results before saving.
        <span style={{ display: "inline-block", marginTop: 6, background: "var(--sand-bg)", border: "1px solid var(--sand-border)", borderRadius: 4, padding: "3px 8px", fontSize: 11, color: "var(--sand-text)" }}>
          Prototype — saving is currently disabled
        </span>
      </p>

      {!reviewData ? (
        <form onSubmit={handleUpload}>
          <label style={labelStyle}>Upload Pedigree Image (PNG / JPG)</label>
          <input type="file" accept=".png,.jpg,.jpeg" onChange={handleFileChange}
            style={{ border: "1px solid var(--border)", borderRadius: 6, padding: "9px 12px", fontSize: 13, background: "var(--white)", color: "var(--text)", fontFamily: "var(--font-lato)", width: "100%", marginBottom: 20 }} />
          {error && <p style={{ color: "#C05050", fontSize: 13, fontFamily: "var(--font-lato)", marginBottom: 12 }}>{error}</p>}
          <button type="submit" disabled={!file || loading} style={{ ...btnStyle, opacity: !file || loading ? 0.5 : 1, cursor: !file || loading ? "not-allowed" : "pointer" }}>
            {loading ? "Analysing…" : "Upload & Analyse"}
          </button>
        </form>
      ) : (
        <div>
          <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "var(--teal-dark)", marginBottom: 12 }}>Review Extracted Data</h3>
          {reviewData.imageUrl && (
            <div style={{ marginBottom: 20, border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
              <img src={reviewData.imageUrl} alt="Uploaded Pedigree" style={{ maxWidth: "100%", height: "auto", display: "block" }} />
            </div>
          )}
          <PedigreeReviewForm horse={reviewData.rootHorse} onChange={handleRootHorseChange} />
          <AncestorReviewList ancestors={reviewData.ancestors} onAncestorChange={handleAncestorChange} />
          {error && <p style={{ color: "#C05050", fontSize: 13, fontFamily: "var(--font-lato)", marginTop: 20 }}>{error}</p>}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24 }}>
            <button type="button" onClick={() => setReviewData(null)} style={secondaryBtn}>Cancel</button>
            <button type="button" disabled style={{ ...btnStyle, opacity: 0.5, cursor: "not-allowed" }}>Save Disabled (Prototype)</button>
          </div>
        </div>
      )}
    </div>
  );
}
