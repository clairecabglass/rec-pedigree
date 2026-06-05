"use client";
import { useState, useRef } from "react";
import * as htmlToImage from "html-to-image";
import ShareCardTemplate from "./ShareCardTemplate";
import { FullHorseData } from "@/lib/types"; // Import FullHorseData

// 1x1 transparent PNG used as the imagePlaceholder so a single broken/CORS
// image inside the template can't fail the whole html-to-image render.
const TRANSPARENT_PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

// Fetch a cross-origin image and convert it to a data URL. Embedding the
// photo into the DOM as a data URL means html-to-image never has to worry
// about CORS / tainted canvases / browser cache when serialising the card.
async function imageUrlToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors", cache: "no-cache" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

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
  const [, setImageLoaded] = useState(false); // tracked by the template's onLoad
  const [embeddedHero, setEmbeddedHero] = useState<PhotoData | undefined>(hero);
  const cardRef = useRef<HTMLDivElement>(null);

  // Preload the hero from R2 into a data URL before rendering the hidden card.
  // Without this, html-to-image hits the R2 fetch itself, gets an `error` Event
  // back (the `[object Event]` alert), and aborts the whole export.
  async function prepareEmbeddedHero() {
    if (!hero?.url || hero.url.startsWith("data:")) return hero;
    const dataUrl = await imageUrlToDataUrl(hero.url);
    if (!dataUrl) return undefined; // give up the hero, let the card render text-only
    return { url: dataUrl, caption: hero.caption };
  }

  const handleDownload = async () => {
    if (!cardRef.current) return;

    setDownloading(true);
    try {
      // 1. Replace the hero with an inline data URL so the canvas never has to
      //    fetch cross-origin during the export.
      const safeHero = await prepareEmbeddedHero();
      setEmbeddedHero(safeHero);

      // 2. Give React a tick to paint with the new src, then wait for the
      //    image element to actually finish decoding before snapshotting.
      await new Promise((r) => setTimeout(r, 50));
      const imgs = Array.from(cardRef.current.querySelectorAll("img"));
      await Promise.all(
        imgs.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete && img.naturalWidth > 0) return resolve();
              img.addEventListener("load", () => resolve(), { once: true });
              img.addEventListener("error", () => resolve(), { once: true }); // never block on a broken image
            })
        )
      );

      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "transparent",
        cacheBust: true,          // dodge stale-cache 304s that some libs read as errors
        skipFonts: true,          // skip embedding webfonts — they can fail with cross-origin CSS
        imagePlaceholder: TRANSPARENT_PX, // graceful fallback if any <img> still errors
        // Fallback fetch options for anything else the card might reference
        fetchRequestInit: { mode: "cors", cache: "no-cache" },
        filter: (node) => {
          // Don't try to embed scripts / iframes; they're never in the card
          // anyway but better safe than crash-y.
          if (!(node instanceof Element)) return true;
          const tag = node.tagName?.toLowerCase();
          return tag !== "script" && tag !== "iframe";
        },
      });

      const link = document.createElement("a");
      link.download = `${horse.name.replace(/\s+/g, "_")}_${selectedTemplate}_card.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: unknown) {
      console.error("Failed to generate share card:", err);
      // Turn opaque Event objects from html-to-image into something readable.
      let msg = "Unknown error";
      if (err instanceof Error) msg = err.message;
      else if (err && typeof err === "object" && "type" in err) msg = `${(err as Event).type} event`;
      else if (typeof err === "string") msg = err;
      alert(`Couldn't generate the share card.\n\n${msg}\n\nTip: if the horse's photo just failed to load above, try again — the card will skip the photo on a second attempt.`);
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
        <ShareCardTemplate ref={cardRef} horse={horse} sire={sire} dam={dam} hero={embeddedHero} template={selectedTemplate} setImageLoaded={setImageLoaded} />
      </div>
    </>
  );
}