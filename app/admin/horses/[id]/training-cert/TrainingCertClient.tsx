"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import Link from "next/link";

const CERT_W = 1414;
const CERT_H = 2000;
const PREVIEW_SCALE = 0.5;

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

interface Props {
  id: string;
  name: string;
  templateDataUri: string;
}

export default function TrainingCertClient({ id, name, templateDataUri }: Props) {
  const certRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (!certRef.current) return;
    setLoading(true);
    try {
      await toPng(certRef.current, { pixelRatio: 2, cacheBust: true });
      const dataUrl = await toPng(certRef.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${slug(name)}-training-cert.png`;
      a.click();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "32px 24px", fontFamily: "var(--font-lato)" }}>
      <div style={{ maxWidth: CERT_W * PREVIEW_SCALE + 48, margin: "0 auto" }}>
        <div style={{ marginBottom: 16 }}>
          <Link href={`/admin/horses/${id}/papers`} style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none" }}>
            ← Back to Papers
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 24, color: "var(--teal-dark)", margin: 0 }}>
            Training Certificate
          </h1>
          <button
            onClick={handleDownload}
            disabled={loading}
            style={{
              background: "var(--teal)", color: "white", border: "none", borderRadius: 8,
              padding: "10px 22px", fontFamily: "var(--font-lato)", fontWeight: 700,
              fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Generating…" : "↓ Download PNG"}
          </button>
        </div>

        {/* Preview wrapper */}
        <div style={{ width: CERT_W * PREVIEW_SCALE, height: CERT_H * PREVIEW_SCALE, overflow: "hidden", border: "1px solid var(--border)", borderRadius: 8 }}>
          <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: "top left", width: CERT_W, height: CERT_H }}>
            <CertBody name={name} templateDataUri={templateDataUri} ref={certRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

import { forwardRef } from "react";

const CertBody = forwardRef<HTMLDivElement, { name: string; templateDataUri: string }>(
  function CertBody({ name, templateDataUri }, ref) {
    return (
      <div
        ref={ref}
        style={{
          width: CERT_W,
          height: CERT_H,
          position: "relative",
          overflow: "hidden",
          background: "#fff",
        }}
      >
        {/* Background template */}
        {templateDataUri && (
          <img
            src={templateDataUri}
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}

        {/* Horse name overlay */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "8%",
            right: "8%",
            textAlign: "center",
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 52,
            fontWeight: "normal",
            color: "#527070",
            letterSpacing: "0.18em",
          }}
        >
          {name}
        </div>
      </div>
    );
  }
);
