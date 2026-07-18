import type React from "react";

const GROUND = "#A9BFBB";
const RAIL = "var(--teal-dark)";
const FILL = "var(--teal-muted)";
const ACCENT = "var(--gold)";
const DITCH_FILL = "var(--sand-text)";
const DITCH_BORDER = "#8C7440";
const WATER_FILL = "var(--sire-bg)";
const WATER_BORDER = "var(--sire-border)";

function Ground({ x1 = 2, x2 = 78 }: { x1?: number; x2?: number } = {}) {
  return <line x1={x1} y1="42" x2={x2} y2="42" stroke={GROUND} strokeWidth="2.5" />;
}
function Post({ x, top = 14 }: { x: number; top?: number }) {
  return <rect x={x} y={top} width="3" height={42 - top} fill={RAIL} />;
}
function Rail({ y, x1 = 12, x2 = 68 }: { y: number; x1?: number; x2?: number }) {
  return <line x1={x1} y1={y} x2={x2} y2={y} stroke={RAIL} strokeWidth="3.5" strokeLinecap="round" />;
}

export const JUMP_ICONS: Record<string, (props: { size?: number }) => React.JSX.Element> = {
  Vertical: ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <Ground /><Post x={11} /><Post x={66} /><Rail y={20} />
    </svg>
  ),
  Oxer: ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <Ground /><Post x={11} /><Post x={66} /><Post x={30} top={20} /><Post x={49} top={28} />
      <Rail y={20} /><Rail y={28} x1={28} x2={51} />
    </svg>
  ),
  "Triple Bar": ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <Ground /><Post x={9} top={26} /><Post x={28} top={20} /><Post x={47} top={14} /><Post x={66} top={8} />
      <Rail y={28} x1={9} x2={31} /><Rail y={22} x1={28} x2={50} /><Rail y={16} x1={47} x2={69} />
    </svg>
  ),
  "Water jump": ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <Ground x1={2} x2={11} /><Ground x1={69} x2={78} />
      <Post x={11} top={20} /><Post x={66} top={20} /><Rail y={26} />
      <rect x="9" y="38" width="62" height="7" fill={WATER_FILL} stroke={WATER_BORDER} strokeWidth="1.5" />
      <path d="M16,41.5 q5,-3 10,0 q5,-3 10,0 q5,-3 10,0 q5,-3 10,0 q5,-3 10,0" fill="none" stroke={WATER_BORDER} strokeWidth="1" />
    </svg>
  ),
  Liverpool: ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <Ground /><Post x={11} /><Post x={66} /><Rail y={20} />
      <rect x="17" y="34" width="46" height="8" fill={WATER_FILL} stroke={WATER_BORDER} strokeWidth="1.5" />
      <path d="M21,38 q4,-2.5 8,0 q4,-2.5 8,0 q4,-2.5 8,0 q4,-2.5 8,0" fill="none" stroke={WATER_BORDER} strokeWidth="1" />
    </svg>
  ),
  Crossrail: ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <Ground /><Post x={11} /><Post x={66} />
      <line x1="13" y1="40" x2="67" y2="16" stroke={RAIL} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="13" y1="16" x2="67" y2="40" stroke={RAIL} strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  ),
  "Wall -": ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <Ground />
      <g fill={FILL} stroke={RAIL} strokeWidth="1.5">
        <rect x="13" y="14" width="54" height="9" />
        <rect x="13" y="24" width="54" height="9" />
        <rect x="13" y="34" width="54" height="8" />
      </g>
      <line x1="40" y1="14" x2="40" y2="23" stroke={GROUND} />
      <line x1="26" y1="24" x2="26" y2="33" stroke={GROUND} />
      <line x1="54" y1="24" x2="54" y2="33" stroke={GROUND} />
      <line x1="22" y1="14" x2="22" y2="23" stroke={GROUND} />
      <line x1="58" y1="14" x2="58" y2="23" stroke={GROUND} />
    </svg>
  ),
  "Plank -": ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <Ground /><Post x={11} /><Post x={66} />
      <rect x="11" y="17" width="58" height="6" fill={ACCENT} stroke={RAIL} strokeWidth="1" />
    </svg>
  ),
  Arrowhead: ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <Ground />
      <polygon points="40,12 64,42 16,42" fill={FILL} stroke={RAIL} strokeWidth="2.5" />
    </svg>
  ),
  Bank: ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <Ground />
      <polygon points="10,42 32,42 50,20 78,20 78,42" fill={FILL} stroke={RAIL} strokeWidth="2.5" />
      <line x1="50" y1="20" x2="78" y2="20" stroke={RAIL} strokeWidth="3" />
    </svg>
  ),
  "Brush fence": ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <Ground /><Post x={11} /><Post x={66} /><Rail y={32} />
      <path d="M11,32 q4,-13 9,0 q4,-13 9,0 q4,-13 9,0 q4,-13 9,0 q4,-13 9,0 q4,-13 9,0 q4,-13 9,0" fill="var(--sage-bg)" stroke="var(--sage-text)" strokeWidth="2" />
    </svg>
  ),
  Coffin: ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <Ground x1={2} x2={16} /><Ground x1={64} x2={78} />
      <Post x={9} top={24} /><Rail y={24} x1={4} x2={16} />
      <polygon points="22,42 40,33 58,42" fill={DITCH_FILL} stroke={DITCH_BORDER} strokeWidth="1.5" />
      <Post x={68} top={24} /><Rail y={24} x1={64} x2={76} />
    </svg>
  ),
  Coop: ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <Ground />
      <polygon points="13,42 13,30 40,16 67,30 67,42" fill={FILL} stroke={RAIL} strokeWidth="2.5" />
    </svg>
  ),
  Corner: ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <Ground />
      <Post x={9} top={28} /><Post x={68} top={28} />
      <line x1="10" y1="30" x2="40" y2="14" stroke={RAIL} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="40" y1="14" x2="70" y2="30" stroke={RAIL} strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  ),
  Ditch: ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <Ground x1={2} x2={18} /><Ground x1={62} x2={78} />
      <polygon points="18,42 40,30 62,42" fill={DITCH_FILL} stroke={DITCH_BORDER} strokeWidth="2" />
    </svg>
  ),
  "Drop fence": ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <line x1="2" y1="32" x2="42" y2="32" stroke={GROUND} strokeWidth="2.5" />
      <line x1="42" y1="32" x2="42" y2="44" stroke={GROUND} strokeWidth="2.5" />
      <line x1="42" y1="44" x2="78" y2="44" stroke={GROUND} strokeWidth="2.5" />
      <Post x={13} top={14} /><Post x={30} top={14} /><Rail y={14} x1={11} x2={32} />
    </svg>
  ),
  Table: ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <Ground />
      <rect x="13" y="20" width="54" height="22" fill={FILL} stroke={RAIL} strokeWidth="2.5" />
      <line x1="13" y1="20" x2="67" y2="20" stroke={RAIL} strokeWidth="3" />
    </svg>
  ),
  "Tiger Trap": ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <Ground />
      <line x1="13" y1="42" x2="13" y2="26" stroke={RAIL} strokeWidth="2.5" />
      <line x1="13" y1="26" x2="40" y2="16" stroke={RAIL} strokeWidth="2.5" />
      <line x1="40" y1="16" x2="67" y2="26" stroke={RAIL} strokeWidth="2.5" />
      <line x1="67" y1="26" x2="67" y2="42" stroke={RAIL} strokeWidth="2.5" />
      <line x1="22" y1="35" x2="36" y2="22" stroke={GROUND} strokeWidth="1.5" />
      <line x1="44" y1="22" x2="58" y2="35" stroke={GROUND} strokeWidth="1.5" />
    </svg>
  ),
  Trakehner: ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <Ground x1={2} x2={16} /><Ground x1={64} x2={78} />
      <polygon points="16,42 40,30 64,42" fill={DITCH_FILL} stroke={DITCH_BORDER} strokeWidth="2" />
      <Post x={11} top={14} /><Post x={66} top={14} /><Rail y={18} />
    </svg>
  ),
  Wall: ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <Ground />
      <g fill={FILL} stroke={RAIL} strokeWidth="1.5">
        <rect x="13" y="14" width="54" height="9" />
        <rect x="13" y="24" width="54" height="9" />
        <rect x="13" y="34" width="54" height="8" />
      </g>
    </svg>
  ),
  "Water-Crossings": ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <Ground x1={2} x2={9} /><Ground x1={71} x2={78} />
      <rect x="9" y="32" width="62" height="12" fill={WATER_FILL} stroke={WATER_BORDER} strokeWidth="1.5" />
      <path d="M15,38 q4,-3 8,0 q4,-3 8,0 q4,-3 8,0 q4,-3 8,0 q4,-3 8,0 q4,-3 8,0" fill="none" stroke={WATER_BORDER} strokeWidth="1" />
    </svg>
  ),
  "Sunken Road": ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <line x1="2" y1="28" x2="22" y2="28" stroke={GROUND} strokeWidth="2.5" />
      <line x1="22" y1="28" x2="30" y2="42" stroke={GROUND} strokeWidth="2.5" />
      <line x1="30" y1="42" x2="50" y2="42" stroke={GROUND} strokeWidth="2.5" />
      <line x1="50" y1="42" x2="58" y2="28" stroke={GROUND} strokeWidth="2.5" />
      <line x1="58" y1="28" x2="78" y2="28" stroke={GROUND} strokeWidth="2.5" />
      <Post x={11} top={10} /><Rail y={14} x1={5} x2={17} />
      <Post x={62} top={10} /><Rail y={14} x1={56} x2={68} />
    </svg>
  ),
  Skinny: ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <Ground /><Post x={32} /><Post x={45} /><Rail y={20} x1={30} x2={48} />
    </svg>
  ),
  "Log Fence": ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <Ground />
      <rect x="15" y="23" width="50" height="14" rx="7" fill="var(--sand-bg)" stroke={DITCH_BORDER} strokeWidth="2" />
      <ellipse cx="15" cy="30" rx="7" ry="7" fill="var(--sand-bg)" stroke={DITCH_BORDER} strokeWidth="2" />
      <ellipse cx="65" cy="30" rx="7" ry="7" fill="var(--sand-bg)" stroke={DITCH_BORDER} strokeWidth="2" />
      <line x1="26" y1="26" x2="26" y2="34" stroke={DITCH_BORDER} strokeWidth="1" />
      <line x1="40" y1="25" x2="40" y2="35" stroke={DITCH_BORDER} strokeWidth="1" />
      <line x1="54" y1="26" x2="54" y2="34" stroke={DITCH_BORDER} strokeWidth="1" />
    </svg>
  ),
  Rolltop: ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <Ground />
      <path d="M13,42 Q13,16 40,16 Q67,16 67,42 Z" fill={FILL} stroke={RAIL} strokeWidth="2.5" />
    </svg>
  ),
  Ramp: ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <Ground />
      <polygon points="13,42 67,42 67,18" fill={FILL} stroke={RAIL} strokeWidth="2.5" />
    </svg>
  ),
  Bullfinch: ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <Ground /><Post x={11} /><Post x={66} top={4} /><Rail y={28} />
      <path d="M11,28 q4,-22 9,0 q4,-22 9,0 q4,-22 9,0 q4,-22 9,0 q4,-22 9,0 q4,-22 9,0 q4,-22 9,0" fill="var(--sage-bg)" stroke="var(--sage-text)" strokeWidth="2" />
    </svg>
  ),
  Keyhole: ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <Ground />
      <rect x="13" y="14" width="54" height="28" fill={FILL} stroke={RAIL} strokeWidth="2.5" />
      <circle cx="40" cy="25" r="8" fill="var(--cream)" stroke={RAIL} strokeWidth="1.5" />
      <polygon points="34,29 46,29 41,42 39,42" fill="var(--cream)" stroke={RAIL} strokeWidth="1.5" />
    </svg>
  ),
  "Normandy Bank": ({ size = 80 }) => (
    <svg viewBox="0 0 80 50" width={size} height={size * 0.625}>
      <Ground x1={2} x2={18} />
      <polygon points="18,42 30,32 42,42" fill={DITCH_FILL} stroke={DITCH_BORDER} strokeWidth="1.5" />
      <polygon points="42,42 62,42 62,22 78,22 78,42" fill={FILL} stroke={RAIL} strokeWidth="2.5" />
      <Post x={59} top={10} /><Rail y={14} x1={53} x2={71} />
    </svg>
  ),
};

export function getJumpIcon(name: string) {
  const key = Object.keys(JUMP_ICONS).find((k) => k.replace(/[\s-]+/g, "").toLowerCase() === name.replace(/[\s-]+/g, "").toLowerCase());
  return key ? JUMP_ICONS[key] : null;
}
