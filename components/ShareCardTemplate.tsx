"use client";
import React, { forwardRef, useMemo } from "react";
// import type { Photo } from "@prisma/client"; // This type is not needed here
// import Image from "next/image"; // Not directly used in the template, only img tag
// import Icon from "./Icon"; // Not used in this version of the template
// Pedigree tree related imports are no longer needed for share card templates
// import { buildPedigreeTree } from "@/lib/pedigree";
// import type { HorseMap, HorseNode } from "@/lib/pedigree";
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

interface ShareCardTemplateProps {
  horse: FullHorseData; // Updated to FullHorseData
  sire?: FullHorseData; // Updated to FullHorseData
  dam?: FullHorseData; // Updated to FullHorseData
  hero?: PhotoData;
  template: "profile" | "sale" | "stud"; // Removed "pedigree"
  // allHorses: FullHorseData[]; // No longer needed as pedigree template is removed
}

const OWNERSHIP_COLORS: Record<string, string> = {
  "Home": "#D4E3E1", "For Sale": "#FFF3D0", "Sold": "#E8E8E8",
  "Outside": "#E8F4E8", "Void": "#F3E0E0", "Outside not owned": "#E8F4E8",
};

const ShareCardTemplate = forwardRef<HTMLDivElement, ShareCardTemplateProps>(
  ({ horse, sire, dam, hero, template /*, allHorses*/ }, ref) => { // Removed allHorses from destructuring
    const cardWidth = 800;
    const cardHeight = 450;
    const isProfile = template === "profile";
    const isSale = template === "sale";
    const isStud = template === "stud";
    // const isPedigree = template === "pedigree"; // Removed

    // Dynamic badge logic
    const showForSaleBadge = isSale || horse.ownership === "For Sale";
    const showAtStudBadge = isStud || (horse.gender === "Stallion" && (horse.breedingFee || horse.breedingPolicies));

    // Conditional content for each template
    const mainContent = useMemo(() => {
      if (isSale) {
        return (
          <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
            <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 68, lineHeight: 1, color: "var(--gold-light)" }}>{horse.name}</h1>
            <p style={{ fontSize: 28, fontFamily: "var(--font-lato)", color: "var(--cream)", lineHeight: 1.2 }}>
              {[horse.breed, horse.gender, horse.coat].filter(Boolean).join("  ·  ") || "Unknown Breed"}
            </p>
            {horse.price && (
              <p style={{ fontFamily: "var(--font-playfair)", fontSize: 48, color: "var(--gold)", fontWeight: 700, marginTop: 15 }}>{horse.price}</p>
            )}
            {horse.saleDescription && (
              <p style={{ fontSize: 18, fontFamily: "var(--font-lato)", color: "var(--cream-dark)", marginTop: 10, maxWidth: "80%", whiteSpace: "pre-wrap" }}>{horse.saleDescription}</p>
            )}
            {horse.saleContact && (
              <p style={{ fontSize: 18, fontFamily: "var(--font-lato)", color: "var(--cream-dark)", marginTop: 10 }}>Contact: {horse.saleContact}</p>
            )}
          </div>
        );
      } else if (isStud) {
        return (
          <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
            <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 68, lineHeight: 1, color: "var(--teal-light)" }}>{horse.name}</h1>
            <p style={{ fontSize: 28, fontFamily: "var(--font-lato)", color: "var(--cream)", lineHeight: 1.2 }}>
              {[horse.breed, horse.gender, horse.coat].filter(Boolean).join("  ·  ") || "Unknown Breed"}
            </p>
            {horse.breedingFee && (
              <p style={{ fontFamily: "var(--font-playfair)", fontSize: 48, color: "var(--teal)", fontWeight: 700, marginTop: 15 }}>Breeding Fee: {horse.breedingFee}</p>
            )}
            {horse.breedingPolicies && (
              <p style={{ fontSize: 18, fontFamily: "var(--font-lato)", color: "var(--cream-dark)", marginTop: 10, maxWidth: "80%", whiteSpace: "pre-wrap" }}>Policies: {horse.breedingPolicies}</p>
            )}
          </div>
        );
      } else { // Default Profile card
        return (
          <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
            <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 68, lineHeight: 1, marginBottom: 10, color: "var(--gold-light)" }}>{horse.name}</h1>
            <p style={{ fontSize: 28, fontFamily: "var(--font-lato)", color: "var(--cream)", lineHeight: 1.2 }}>
              {[horse.breed, horse.gender, horse.coat].filter(Boolean).join("  ·  ") || "Unknown Breed"}
            </p>
            {(horse.genotype || horse.regNumber) && (
              <p style={{ fontSize: 20, fontFamily: "var(--font-lato)", color: "var(--cream-dark)", marginTop: 10 }}>
                {horse.genotype && `Genotype: ${horse.genotype}`}
                {horse.genotype && horse.regNumber && `  ·  `}
                {horse.regNumber && `Reg#: ${horse.regNumber}`}
              </p>
            )}
            {(sire || dam) && (
              <div style={{ marginTop: 20, fontSize: 24, fontFamily: "var(--font-lato)", color: "var(--cream-light)" }}>
                {sire && (
                  <>
                    <span style={{ color: "var(--sire-text)" }}>{sire.name}</span>
                    <span style={{ color: "var(--cream-dark)" }}> x </span>
                  </>
                )}
                {dam && <span style={{ color: "var(--dam-text)" }}>{dam.name}</span>}
              </div>
            )}
          </div>
        );
      }
    }, [horse, sire, dam, isSale, isStud]);


    return (
      <div
        ref={ref}
        style={{
          width: cardWidth,
          height: cardHeight,
          background: "linear-gradient(135deg, var(--cream), var(--cream-dark))",
          fontFamily: "var(--font-lato)",
          color: "var(--text)",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          border: "4px solid var(--gold)",
          borderRadius: 12,
        }}
      >
        {/* Background Image/Photo */}
        {hero?.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hero.url}
            alt={horse.name}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(0.5) blur(2px)", // Subtle background effect
            }}
          />
        )}

        {/* Overlay content */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 30,
            color: "var(--white)", // Default text color on dark background
            textShadow: "0 1px 3px rgba(0,0,0,0.4)",
          }}
        >
          {/* Top Section: Stable Prefix / Logo */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            {horse.stablePrefix && (
              <span style={{
                fontFamily: "var(--font-playfair)",
                fontSize: 28,
                fontWeight: 700,
                color: "var(--gold-light)",
                letterSpacing: "0.05em",
              }}>
                {horse.stablePrefix}
              </span>
            )}
            {/* You could add a small logo here */}
            {/* <img src="/brand/logo-icon.png" alt="Logo" style={{ height: 40 }} /> */}
          </div>

          {/* Middle Section: Main Content based on template */}
          {mainContent}

          {/* Bottom Section: Badges / Logos */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", gap: 15 }}>
              {showForSaleBadge && (
                <span
                  style={{
                    background: "var(--gold)",
                    color: "white",
                    fontFamily: "var(--font-lato)",
                    fontSize: 20,
                    fontWeight: 700,
                    padding: "8px 20px",
                    borderRadius: 8,
                    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                  }}
                >
                  FOR SALE
                </span>
              )}
              {showAtStudBadge && (
                <span
                  style={{
                    background: "var(--teal)",
                    color: "white",
                    fontFamily: "var(--font-lato)",
                    fontSize: 20,
                    fontWeight: 700,
                    padding: "8px 20px",
                    borderRadius: 8,
                    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                  }}
                >
                  AT STUD
                </span>
              )}
            </div>
            {/* Small site logo or URL */}
            <span style={{ fontFamily: "var(--font-lato)", fontSize: 18, color: "var(--cream-dark)", opacity: 0.8 }}>
              redfieldec.site
            </span>
          </div>
        </div>
      </div>
    );
  }
);

ShareCardTemplate.displayName = 'ShareCardTemplate'; // Required for forwardRef

export default ShareCardTemplate;
