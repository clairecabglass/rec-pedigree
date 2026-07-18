"use client";
import { useEffect, useState } from "react";

const THEMES = [
  {
    id: "default",
    name: "Meadow",
    bg: "#FBF8F4",
    accent: "#5E8080",
  },
  {
    id: "soft-blush",
    name: "Soft Blush",
    bg: "#FFF8F8",
    accent: "#DB7F8E",
  },
  {
    id: "buttermilk",
    name: "Buttermilk",
    bg: "#FAF5EF",
    accent: "#B87AA8",
  },
] as const;

type ThemeId = typeof THEMES[number]["id"];

function applyTheme(id: ThemeId) {
  if (id === "default") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", id);
  }
}

export default function ThemePicker() {
  const [active, setActive] = useState<ThemeId>("default");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("site-theme") as ThemeId | null;
      if (saved) { setActive(saved); applyTheme(saved); }
    } catch {}
  }, []);

  function pick(id: ThemeId) {
    setActive(id);
    applyTheme(id);
    try {
      if (id === "default") localStorage.removeItem("site-theme");
      else localStorage.setItem("site-theme", id);
    } catch {}
  }

  return (
    <div>
      <p style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-lato)", fontWeight: 600, marginBottom: 12 }}>
        Site Theme
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {THEMES.map((t) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => pick(t.id)}
              title={t.name}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                border: isActive ? `2px solid ${t.accent}` : "2px solid transparent",
                background: isActive ? `${t.bg}` : "var(--cream-dark)",
                borderRadius: 20, padding: "6px 14px 6px 8px",
                cursor: "pointer", fontFamily: "var(--font-lato)",
                fontSize: 12, fontWeight: isActive ? 700 : 400,
                color: isActive ? t.accent : "var(--text-muted)",
                boxShadow: isActive ? `0 0 0 3px ${t.accent}28` : "none",
                transition: "all 0.15s ease",
              }}
            >
              {/* Two-tone swatch */}
              <span style={{
                width: 22, height: 22, borderRadius: "50%",
                background: `linear-gradient(135deg, ${t.bg} 50%, ${t.accent} 50%)`,
                border: "1.5px solid rgba(0,0,0,0.10)",
                flexShrink: 0, display: "block",
              }} />
              {t.name}
              {isActive && (
                <span style={{ fontSize: 10, marginLeft: 2 }}>✓</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
