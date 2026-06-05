"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import * as htmlToImage from "html-to-image";
import ShareCardTemplate from "./ShareCardTemplate";
import { FullHorseData } from "@/lib/types"; // Import FullHorseData

// The local HorseDataForCard interface is replaced by FullHorseData from "@/lib/types"
// interface HorseDataForCard {
//   id: string;
//   name: string;
//   breed: string | null;
//   gender: string | null;
//   coat: string | null;
//   genotype: string | null;
//   sireName: string | null;
//   damName: string | null;
//   ownership: string | null;
//   regNumber: string | null;
//   stablePrefix: string | null;
//   breedingFee: string | null;
//   breedingPolicies: string | null;
//   price: string | null;
//   saleDescription: string | null;
//   saleContact: string | null;
// }

interface PhotoData {
  url: string;
  caption?: string | null;
}

interface ShareCardGeneratorProps {
  horse: FullHorseData;
  sire?: FullHorseData;
  dam?: FullHorseData;
  hero?: PhotoData;
}

export default function ShareCardGenerator({ horse, sire, dam, hero }: ShareCardGeneratorProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<"profile" | "sale" | "stud">("profile");
  const [downloading, setDownloading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false); // New state to track image loading
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;

    setDownloading(true);
    // Wait a moment for rendering and image loading, especially in a hidden div
    // In a real app, you might want a more robust image preloader or an IntersectionObserver
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for 500ms

    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "transparent",
        fetchRequestInit: {
          mode: 'cors', // Attempt to fetch resources with CORS
        },
      });

      const link = document.createElement("a");
      link.download = `${horse.name.replace(/\s+/g, "_")}_${selectedTemplate}_card.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error("Failed to generate image:", error);
      alert(`Failed to generate image. Please try again. Error: ${error.message || error}`);
    } finally {
      setDownloading(false);
      setModalOpen(false);
    }
  };

  const buttonStyle = {
    display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13,
    color: "var(--teal-dark)", background: "var(--white)", border: "1px solid var(--teal)",
    padding: "7px 16px", borderRadius: 6, textDecoration: "none", fontFamily: "var(--font-lato)", fontWeight: 700,
    cursor: "pointer", whiteSpace: "nowrap" as const,
  };
  const modalOverlayStyle: React.CSSProperties = {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000,
  };
  const modalContentStyle: React.CSSProperties = {
    background: "var(--cream)", borderRadius: 10, padding: 24,
    maxWidth: 500, width: "90%", boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
    maxHeight: "90vh", overflowY: "auto", position: "relative",
  };
  const closeButtonStyle: React.CSSProperties = {
    position: "absolute", top: 12, right: 12, background: "none", border: "none",
    fontSize: 24, cursor: "pointer", color: "var(--text-muted)",
  };
  const templateOptionStyle: React.CSSProperties = {
    background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, padding: 14,
    textAlign: "center", cursor: "pointer", transition: "background 0.15s, border-color 0.15s",
    fontFamily: "var(--font-lato)", fontSize: 14, fontWeight: 600, color: "var(--teal-dark)",
  };
  const templateOptionActiveStyle: React.CSSProperties = {
    ...templateOptionStyle,
    background: "var(--teal-muted)",
    borderColor: "var(--teal)",
  };

  return (
    <>
      <button onClick={() => setModalOpen(true)} style={buttonStyle}>
        Share Card
      </button>

      {modalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <button onClick={() => setModalOpen(false)} style={closeButtonStyle}>✕</button>
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 24, color: "var(--teal-dark)", marginBottom: 16 }}>Generate Share Card</h2>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: "var(--text-muted)", marginBottom: 20 }}>
              Select a card template to generate a shareable image for Discord.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              <div style={selectedTemplate === "profile" ? templateOptionActiveStyle : templateOptionStyle} onClick={() => setSelectedTemplate("profile")}>Profile Card</div>
              <div style={selectedTemplate === "sale" ? templateOptionActiveStyle : templateOptionStyle} onClick={() => setSelectedTemplate("sale")}>Sale Card</div>
              <div style={selectedTemplate === "stud" ? templateOptionActiveStyle : templateOptionStyle} onClick={() => setSelectedTemplate("stud")}>Stud Card</div>
            </div>

            <button onClick={handleDownload} disabled={downloading} style={{ ...buttonStyle, background: "var(--teal)", color: "white", width: "100%", justifyContent: "center" }}>
              {downloading ? "Generating..." : "Download PNG"}
            </button>
          </div>
        </div>
      )}

      {/* Hidden component to render the card for html-to-image conversion */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px", opacity: 0 }}>
        <ShareCardTemplate ref={cardRef} horse={horse} sire={sire} dam={dam} hero={hero} template={selectedTemplate} setImageLoaded={setImageLoaded} />
      </div>
    </>
  );
}