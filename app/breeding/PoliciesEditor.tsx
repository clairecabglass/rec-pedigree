"use client";
import { useState } from "react";

export default function PoliciesEditor({ initial }: { initial: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/breeding-policies", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    setSaving(false);
    if (res.ok) { setSavedAt(new Date().toLocaleTimeString()); setOpen(false); window.location.reload(); }
    else alert("Could not save policies.");
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        style={{ marginTop: 16, background: "var(--white)", border: "1px solid var(--teal)", color: "var(--teal-dark)", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-lato)" }}>
        ✎ Edit policies
      </button>
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={14}
        placeholder="Write your breeding policies here…"
        style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 8, padding: 14, fontSize: 14, fontFamily: "var(--font-lato)", lineHeight: 1.6, color: "var(--text)", background: "var(--white)", resize: "vertical" }}
      />
      <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>
        <button onClick={save} disabled={saving}
          style={{ background: "var(--teal)", color: "white", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: saving ? "wait" : "pointer", fontFamily: "var(--font-lato)" }}>
          {saving ? "Saving…" : "Save policies"}
        </button>
        <button onClick={() => { setText(initial); setOpen(false); }} disabled={saving}
          style={{ background: "var(--white)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 6, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-lato)" }}>
          Cancel
        </button>
        {savedAt && <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>Saved {savedAt}</span>}
      </div>
    </div>
  );
}
