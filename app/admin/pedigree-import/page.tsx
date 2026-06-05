"use client";
import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HorseData, AncestorData } from "@/lib/types";
import { PedigreeReviewForm } from "@/components/PedigreeReviewForm";
import { AncestorReviewList } from "@/components/AncestorReviewList";

export default function PedigreeImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<{
    imageUrl: string;
    imageKey: string;
    rootHorse: HorseData;
    ancestors: AncestorData[];
  } | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setReviewData(null); // Clear review data on new file selection
      setError(null);
    }
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select an image file to upload.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/admin/pedigree-import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to process image.");
      }

      const data = await res.json();
      setReviewData(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during upload.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRootHorseChange = (key: keyof HorseData, value: string | boolean) => {
    if (reviewData) {
      setReviewData(prev => ({
        ...prev!,
        rootHorse: {
          ...prev!.rootHorse,
          [key]: value,
        },
      }));
    }
  };

  const handleAncestorChange = (index: number, key: keyof AncestorData, value: string | boolean) => {
    if (reviewData) {
      const updatedAncestors = [...reviewData.ancestors];
      updatedAncestors[index] = {
        ...updatedAncestors[index],
        [key]: value,
      };
      setReviewData(prev => ({
        ...prev!,
        ancestors: updatedAncestors,
      }));
    }
  };

  const cardStyle = { background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, padding: 28 };
  const buttonStyle = {
    background: "var(--teal)", color: "var(--white)", border: "none", borderRadius: 6,
    padding: "11px 28px", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
    fontFamily: "var(--font-lato)", opacity: loading ? 0.7 : 1,
  };
  const secondaryButtonStyle = {
    background: "var(--white)", border: "1px solid var(--border)", borderRadius: 6,
    padding: "11px 28px", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
    fontFamily: "var(--font-lato)", opacity: loading ? 0.7 : 1, color: "var(--teal-dark)",
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link href="/admin" style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none", fontFamily: "var(--font-lato)", display: "block", marginBottom: 20 }}>
        ← Back to Admin
      </Link>
      <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 32, color: "var(--teal-dark)", marginBottom: 24 }}>Import Pedigree Image (Prototype)</h1>

      <div style={cardStyle}>
        {!reviewData ? (
          <form onSubmit={handleUpload}>
            <label style={{
              fontSize: 11, letterSpacing: "0.1em", color: "var(--text-muted)",
              textTransform: "uppercase", fontFamily: "var(--font-lato)", fontWeight: 600,
              display: "block", marginBottom: 4,
            }}>Upload Pedigree Image (PNG/JPG)</label>
            <input
              type="file"
              accept=".png,.jpg,.jpeg"
              onChange={handleFileChange}
              style={{
                border: "1px solid var(--border)", borderRadius: 6, padding: "9px 12px",
                fontSize: 13, background: "var(--white)", color: "var(--text)",
                fontFamily: "var(--font-lato)", outline: "none", width: "100%",
                marginBottom: 20,
              }}
            />
            {error && <p style={{ color: "#C05050", fontSize: 13, fontFamily: "var(--font-lato)", marginBottom: 12 }}>{error}</p>}
            <button type="submit" disabled={!file || loading} style={buttonStyle}>
              {loading ? "Processing..." : "Upload and Analyze"}
            </button>
          </form>
        ) : (
          <div>
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 20, color: "var(--teal-dark)", marginBottom: 16 }}>Review Pedigree Data (Prototype)</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-lato)", marginBottom: 20 }}>
              Please review the extracted data below. (Saving is disabled in this prototype).
            </p>
            {reviewData.imageUrl && (
              <div style={{ marginBottom: 20, border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                <img src={reviewData.imageUrl} alt="Uploaded Pedigree" style={{ maxWidth: "100%", height: "auto", display: "block" }} />
              </div>
            )}
            <PedigreeReviewForm horse={reviewData.rootHorse} onChange={handleRootHorseChange} />
            <AncestorReviewList ancestors={reviewData.ancestors} onAncestorChange={handleAncestorChange} />

            {error && <p style={{ color: "#C05050", fontSize: 13, fontFamily: "var(--font-lato)", marginTop: 20 }}>{error}</p>}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 30 }}>
              <button type="button" onClick={() => setReviewData(null)} style={secondaryButtonStyle}>
                Cancel
              </button>
              <button type="button" disabled style={buttonStyle}>
                Saving Disabled (Prototype)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


