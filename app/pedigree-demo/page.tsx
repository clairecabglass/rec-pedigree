import Link from "next/link";
import { parseHorseCoat } from "@/lib/horseCoat";

/* ============================================================
   Demo: horizontal grid pedigree layout
   Horse: [REC] CINDER CADENCE
   4 generations of ancestors = 16 rows × 5 columns
   ============================================================ */

interface AncestorNode {
  id?: string;
  name: string;
  breed: string | null;
  coat: string | null;
  gender: string | null;
  sire: AncestorNode | null;
  dam: AncestorNode | null;
}

const TREE: AncestorNode = {
  id: "cmpzh132i000014jz4hs9cs73",
  name: "[REC] CINDER CADENCE",
  breed: "Lipizzaner",
  coat: "Rose Grey Tovero (R_G_TOV)",
  gender: "Stallion",
  sire: {
    id: "cmpzh1a0g001i14jzpgv7jfgn",
    name: "[REC] CADET'S SIN",
    breed: "Thoroughbred",
    coat: "Silver Grey (BL_G)",
    gender: "Stallion",
    sire: {
      id: "cmpzh1i66003a14jzj1zf4n74",
      name: "[F.E] WHITE NIGHTSHADE",
      breed: "KWPN",
      coat: "Dark Bay (B)",
      gender: "Stallion",
      sire: {
        id: "cmpzh25qi008f14jzma43in60",
        name: "[F.E] PARSLEY",
        breed: "KWPN",
        coat: "White (BL_G)",
        gender: "Stallion",
        sire: {
          id: "cmpzh25hf008d14jzkm45n8t4",
          name: "[F.E] COW PARSLEY",
          breed: "KWPN",
          coat: "Rose Grey (R_G)",
          gender: "Stallion",
          sire: null,
          dam: null,
        },
        dam: {
          id: "cmpzh25lz008e14jzd2enio3s",
          name: "[F.E] THISTLE",
          breed: "KWPN",
          coat: "Bay (B)",
          gender: "Mare",
          sire: null,
          dam: null,
        },
      },
      dam: {
        id: "cmpzh2642008i14jz1o6dim02",
        name: "[F.E] CAMELIA",
        breed: "KWPN",
        coat: "Mealy Flaxen Chestnut",
        gender: "Mare",
        sire: {
          id: "cmpzh25v1008g14jz5ujsvmjx",
          name: "[F.E] PEACH BLOSSOM I",
          breed: "KWPN",
          coat: "Mealy Chestnut (R_P)",
          gender: "Stallion",
          sire: null,
          dam: null,
        },
        dam: {
          id: "cmpzh25zj008h14jz552iveb9",
          name: "[F.E] NEOTINEA",
          breed: "KWPN",
          coat: null,
          gender: "Mare",
          sire: null,
          dam: null,
        },
      },
    },
    dam: {
      id: "cmpzh194k001b14jzwtwokw0v",
      name: "[REC] WEST POINT SINNER",
      breed: "Thoroughbred",
      coat: "White Grey (Baroque) - BL_G",
      gender: "Mare",
      sire: {
        id: "cmpzh1ga9002v14jzioobz3uz",
        name: "[WRR] SINNER IN CHURCH",
        breed: "Andalusian",
        coat: "True White (BL_G)",
        gender: "Stallion",
        sire: {
          id: "cmpzh2e6100a914jzpmmu1e2q",
          name: "[WRR] JUICE RED PEPPERS",
          breed: "American Quarter Horse",
          coat: "Unknown",
          gender: "Stallion",
          sire: null,
          dam: null,
        },
        dam: {
          id: "cmpzh2f1s00ag14jz07ri1pxf",
          name: "[WRR] JETSTREAM",
          breed: "Andalusian",
          coat: "Jet Black",
          gender: "Mare",
          sire: null,
          dam: null,
        },
      },
      dam: {
        id: "cmpzh1smp005k14jzjsy9hy7s",
        name: "[REC] WEST END",
        breed: "Thoroughbred",
        coat: "Dapple Grey (BL_G)",
        gender: "Mare",
        sire: {
          id: "cmpzh24uq008814jzzr9mbgyk",
          name: "[MGR] MAGIC MIKE",
          breed: "Andalusian",
          coat: "Grey Badger Face",
          gender: "Stallion",
          sire: null,
          dam: null,
        },
        dam: {
          id: "cmpzh1w5b006c14jzh1gfajob",
          name: "[REC] SODASHI",
          breed: "Thoroughbred",
          coat: "True White (BL_DW)",
          gender: "Mare",
          sire: null,
          dam: null,
        },
      },
    },
  },
  dam: {
    id: "cmpzh1fem002o14jzmw5806o4",
    name: "[REC] CINDER'S CONFECTION",
    breed: "Lipizzaner",
    coat: "Black Roan Tovero (BL_TOV)",
    gender: "Mare",
    sire: {
      id: "cmpzh1e0w002e14jzvlr9llq8",
      name: "[REC] CINDER'S GAMBIT",
      breed: "Lipizzaner",
      coat: "Black Roan Tovero (BL_TOV)",
      gender: "Stallion",
      sire: {
        id: "cmpzh1ewl002k14jzcpi9e6v9",
        name: "[EMR] MORNING IN PARIS",
        breed: "Lipizzaner",
        coat: "Dapple Grey (BL_G)",
        gender: "Stallion",
        sire: {
          id: "cmpzh236z007v14jzzn4dis92",
          name: "[EMR] LONDON FOG",
          breed: "Lipizzaner",
          coat: "Dapple Grey (BL_G)",
          gender: "Stallion",
          sire: null,
          dam: null,
        },
        dam: {
          id: "cmpzh23py007z14jz6iuuefv9",
          name: "CORALINE",
          breed: "Andalusian",
          coat: "Black Roan Tovero (BL_TOV)",
          gender: "Mare",
          sire: null,
          dam: null,
        },
      },
      dam: {
        id: "cmpzh1v0m006314jzitxij8t2",
        name: "[REC] LITTLE CHECK",
        breed: "Thoroughbred",
        coat: "Black",
        gender: "Mare",
        sire: {
          id: "cmpzh22b4007o14jzhdvwej8i",
          name: "[REC] CHECKMATE",
          breed: "Thoroughbred",
          coat: "Grey Badger Face",
          gender: "Stallion",
          sire: null,
          dam: null,
        },
        dam: {
          id: "cmpzh22fn007p14jzl5uvrqos",
          name: "[REC] LITTLE DOVE",
          breed: "Thoroughbred",
          coat: "Grey Badger Face",
          gender: "Mare",
          sire: null,
          dam: null,
        },
      },
    },
    dam: {
      id: "cmpzh1e5f002f14jzz94n2z93",
      name: "[REC] SWEET EMBER",
      breed: "Lipizzaner",
      coat: null,
      gender: "Mare",
      sire: {
        id: "cmpzh1dwe002d14jzxa4xbhz3",
        name: "[REC] CARAMEL SYRUP",
        breed: "Lipizzaner",
        coat: "Silver Buckskin Splashed White",
        gender: "Stallion",
        sire: {
          id: "cmpzh1q3m005114jzz8pxunis",
          name: "[REC] BREAKPOINT",
          breed: "Criollo",
          coat: "Silver Buckskin Splashed White",
          gender: "Stallion",
          sire: null,
          dam: null,
        },
        dam: {
          id: "cmpzh21fe007i14jzc8f7k3s5",
          name: "[REC] TWO TONES",
          breed: "Lipizzaner",
          coat: "Buckskin Tobiano",
          gender: "Mare",
          sire: null,
          dam: null,
        },
      },
      dam: {
        id: "cmpzh24cm008414jzmo561xwa",
        name: "[TSS] FIREFLY FLICKER",
        breed: "Lipizzaner",
        coat: null,
        gender: "Mare",
        sire: {
          id: "cmpzh243h008214jzxz4bflnd",
          name: "[TSS] BLEEDING HEART",
          breed: "Lipizzaner",
          coat: null,
          gender: "Stallion",
          sire: null,
          dam: null,
        },
        dam: {
          id: "cmpzh2481008314jznrt3ce44",
          name: "[TSS] ENCHANTMENT",
          breed: "Lipizzaner",
          coat: null,
          gender: "Mare",
          sire: null,
          dam: null,
        },
      },
    },
  },
};

/* ---- Grid builder ---- */

const MAX_DEPTH = 4;          // ancestor generations shown
const TOTAL_ROWS = 16;        // 2^MAX_DEPTH
const NUM_COLS = MAX_DEPTH + 1; // root + 4 ancestor columns

type Side = "root" | "sire" | "dam";

interface GridCell {
  col: number;
  rowStart: number;
  rowSpan: number;
  node: AncestorNode | null;
  side: Side;
}

function flattenToGrid(
  node: AncestorNode | null,
  col: number,
  rowStart: number,
  rowSpan: number,
  side: Side,
  cells: GridCell[],
) {
  cells.push({ col, rowStart, rowSpan, node, side });
  if (col >= NUM_COLS) return;
  const half = rowSpan / 2;
  flattenToGrid(node?.sire ?? null, col + 1, rowStart,        half, col === 1 ? "sire" : side, cells);
  flattenToGrid(node?.dam  ?? null, col + 1, rowStart + half, half, col === 1 ? "dam"  : side, cells);
}

/* ---- Color tokens per side ---- */

const SIDE_STYLES: Record<Side, { bg: string; border: string; text: string; textMuted: string }> = {
  root: {
    bg: "var(--cream)",
    border: "var(--gold)",
    text: "var(--teal-dark)",
    textMuted: "var(--text-muted)",
  },
  sire: {
    bg: "var(--sire-bg)",
    border: "var(--sire-border)",
    text: "var(--sire-text)",
    textMuted: "#7A9BB0",
  },
  dam: {
    bg: "var(--dam-bg)",
    border: "var(--dam-border)",
    text: "var(--dam-text)",
    textMuted: "#AE8099",
  },
};

/* ---- Cell renderer ---- */

function PedigreeCell({ cell }: { cell: GridCell }) {
  const { col, rowStart, rowSpan, node, side } = cell;
  const s = SIDE_STYLES[side];

  // Font sizes shrink with depth
  const nameSize = [15, 13, 12, 11, 10][col - 1];
  const metaSize = [12, 11, 10,  9,  9][col - 1];

  const coat = node?.coat ? parseHorseCoat(node.coat).cleanName || node.coat : null;
  const isUnknown = !node;

  const inner = (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: col === 1 ? "12px 14px" : "6px 10px",
      height: "100%",
      gap: 1,
      overflow: "hidden",
    }}>
      <div style={{
        fontFamily: "var(--font-playfair)",
        fontSize: nameSize,
        fontWeight: 700,
        color: isUnknown ? "var(--text-muted)" : s.text,
        lineHeight: 1.25,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {node?.name ?? "Unknown"}
      </div>

      {node?.breed && (
        <div style={{
          fontFamily: "var(--font-lato)",
          fontSize: metaSize,
          color: s.textMuted,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          lineHeight: 1.3,
        }}>
          {node.gender ? `${node.gender} · ` : ""}{node.breed}
        </div>
      )}

      {coat && (
        <div style={{
          fontFamily: "var(--font-lato)",
          fontSize: metaSize - 1,
          color: s.textMuted,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          opacity: 0.85,
          lineHeight: 1.2,
        }}>
          {coat}
        </div>
      )}
    </div>
  );

  const cellStyle: React.CSSProperties = {
    gridColumn: col,
    gridRow: `${rowStart} / span ${rowSpan}`,
    background: isUnknown ? "var(--cream-dark)" : s.bg,
    border: `1px solid ${isUnknown ? "var(--border)" : s.border}`,
    borderRadius: 4,
    overflow: "hidden",
    boxSizing: "border-box",
    // Root cell gets a slightly thicker accent border on the left
    ...(col === 1 ? { borderLeft: "4px solid var(--gold)" } : {}),
  };

  if (node?.id) {
    return (
      <Link href={`/registry/${node.id}`} style={{ ...cellStyle, textDecoration: "none" }}>
        {inner}
      </Link>
    );
  }

  return <div style={cellStyle}>{inner}</div>;
}

/* ---- Page ---- */

export default function PedigreeDemoPage() {
  const cells: GridCell[] = [];
  flattenToGrid(TREE, 1, 1, TOTAL_ROWS, "root", cells);

  const genLabels = ["Subject", "Parents", "Grandparents", "Great-grandparents", "GG-grandparents"];

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--cream)",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px 10px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-end",
        gap: "12px",
        justifyContent: "space-between",
        background: "white",
      }}>
        <div>
          <Link href="/" style={{
            fontFamily: "var(--font-lato)",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "var(--teal)",
            textDecoration: "none",
          }}>
            ← Back
          </Link>
          <h1 style={{
            fontFamily: "var(--font-playfair)",
            fontSize: 22,
            color: "var(--teal-dark)",
            margin: "2px 0 0",
          }}>
            Pedigree Layout Demo
          </h1>
          <p style={{
            fontFamily: "var(--font-lato)",
            fontSize: 12,
            color: "var(--text-muted)",
            margin: "2px 0 0",
          }}>
            Horizontal grid view · [REC] CINDER CADENCE · 4 generations
          </p>
        </div>

        {/* Generation column labels */}
        <div style={{
          display: "grid",
          gridTemplateColumns: `1.2fr repeat(${MAX_DEPTH}, 1fr)`,
          gap: 2,
          width: "min(680px, 65vw)",
        }}>
          {genLabels.map((label, i) => (
            <div key={i} style={{
              fontFamily: "var(--font-lato)",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--text-muted)",
              textAlign: "center",
              padding: "0 2px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Pedigree grid */}
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: `1.2fr repeat(${MAX_DEPTH}, 1fr)`,
        gridTemplateRows: `repeat(${TOTAL_ROWS}, minmax(32px, 1fr))`,
        gap: 2,
        padding: 12,
        overflow: "auto",
      }}>
        {cells.map((cell, i) => (
          <PedigreeCell key={i} cell={cell} />
        ))}
      </div>
    </div>
  );
}
