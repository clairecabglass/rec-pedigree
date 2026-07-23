"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { ChevronDown, Plus, Pencil, Trash2, X, ChevronUp, ChevronDown as ChevDown } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SystemEvent {
  date: string;
  label: string;
  sublabel?: string;
  href?: string;
  imageUrl?: string | null;
  type: "birth" | "show" | "breeding" | "foal" | "sale";
}

export interface ManualEvent {
  id: string;
  horseId: string;
  date: string;
  title: string;
  description: string | null;
  type: string;
  imageUrl: string | null;
  order: number;
  createdAt: string;
}

type CombinedItem =
  | ({ kind: "system" } & SystemEvent)
  | ({ kind: "manual" } & ManualEvent);

// ── Helpers ───────────────────────────────────────────────────────────────────

const EVENT_TYPES = ["training", "health", "competition", "milestone", "note"];
const TYPE_LABELS: Record<string, string> = {
  training: "Training", health: "Health / Vet", competition: "Competition",
  milestone: "Milestone", note: "Note",
  birth: "Born", show: "Show", breeding: "Breeding", foal: "Foal", sale: "Sale",
};

const TYPE_STYLE: Record<string, { dot: string; border: string }> = {
  birth:       { dot: "var(--teal)",        border: "var(--teal-muted)" },
  show:        { dot: "var(--gold)",         border: "#EFE0AA" },
  breeding:    { dot: "var(--dam-text)",     border: "var(--dam-border)" },
  foal:        { dot: "var(--sire-text)",    border: "var(--sire-border)" },
  sale:        { dot: "var(--sand-text)",    border: "var(--sand-border)" },
  training:    { dot: "var(--teal-dark)",    border: "var(--teal-muted)" },
  health:      { dot: "var(--lilac-text)",   border: "var(--lilac-border)" },
  competition: { dot: "var(--gold)",         border: "#EFE0AA" },
  milestone:   { dot: "var(--sage-text)",    border: "var(--sage-border)" },
  note:        { dot: "var(--text-muted)",   border: "var(--border)" },
};

function sortCombined(sys: SystemEvent[], man: ManualEvent[]): CombinedItem[] {
  const items: CombinedItem[] = [
    ...sys.map(e => ({ kind: "system" as const, ...e })),
    ...man.map(e => ({ kind: "manual" as const, ...e })),
  ];
  return items.sort((a, b) => {
    if (a.type === "birth") return -1;
    if (b.type === "birth") return 1;
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    if (da !== db) return da - db;
    // Same date: system before manual
    if (a.kind !== b.kind) return a.kind === "system" ? -1 : 1;
    // Both manual: by order, then createdAt
    if (a.kind === "manual" && b.kind === "manual") {
      if (a.order !== b.order) return a.order - b.order;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return 0;
  });
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB");

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", border: "1px solid var(--border)",
  borderRadius: 6, fontSize: 13, fontFamily: "var(--font-lato)",
  color: "var(--text)", background: "var(--white)",
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "var(--teal-dark)",
  textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4,
};

// ── Event Form ────────────────────────────────────────────────────────────────

function EventForm({ horseId, initial, onSave, onCancel }: {
  horseId: string;
  initial?: ManualEvent;
  onSave: (ev: ManualEvent) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial ? initial.date.slice(0, 10) : "");
  const [type, setType] = useState(initial?.type ?? "note");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) { setError("Title and date are required."); return; }
    setSaving(true); setError("");
    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("date", date);
    fd.append("type", type);
    fd.append("description", description);
    if (imageFile) fd.append("image", imageFile);
    if (removeImage) fd.append("removeImage", "true");

    const url = initial
      ? `/api/horses/${horseId}/events/${initial.id}`
      : `/api/horses/${horseId}/events`;
    const res = await fetch(url, { method: initial ? "PUT" : "POST", body: fd });
    if (!res.ok) { setError("Failed to save."); setSaving(false); return; }
    const saved = await res.json();
    onSave(saved);
    setSaving(false);
  }

  return (
    <form onSubmit={submit} style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 8, padding: 16, marginBottom: 12 }}>
      <div className="grid md:grid-cols-2 gap-3" style={{ marginBottom: 10 }}>
        <div>
          <label style={labelStyle}>Title *</label>
          <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. First canter session" />
        </div>
        <div>
          <label style={labelStyle}>Date *</label>
          <input type="date" style={inputStyle} value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>Type</label>
        <select style={inputStyle} value={type} onChange={e => setType(e.target.value)}>
          {EVENT_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>Notes</label>
        <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional details…" />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Photo</label>
        {initial?.imageUrl && !removeImage && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={initial.imageUrl} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }} />
            <button type="button" onClick={() => setRemoveImage(true)} style={{ fontSize: 12, color: "var(--inbreed-text)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-lato)" }}>Remove image</button>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ fontSize: 13, fontFamily: "var(--font-lato)" }}
          onChange={e => { setImageFile(e.target.files?.[0] ?? null); setRemoveImage(false); }} />
      </div>
      {error && <p style={{ fontSize: 12, color: "var(--inbreed-text)", marginBottom: 8 }}>{error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={saving} style={{ background: "var(--teal-dark)", color: "white", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-lato)", cursor: saving ? "default" : "pointer" }}>
          {saving ? "Saving…" : initial ? "Save Changes" : "Add Event"}
        </button>
        <button type="button" onClick={onCancel} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 14px", fontSize: 13, fontFamily: "var(--font-lato)", cursor: "pointer", color: "var(--text-muted)" }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function HorseTimeline({
  systemEvents, manualEvents: initialManual, isAdmin, horseId,
}: {
  systemEvents: SystemEvent[];
  manualEvents: ManualEvent[];
  isAdmin: boolean;
  horseId: string;
}) {
  const [open, setOpen] = useState(false);
  const [manualEvents, setManualEvents] = useState<ManualEvent[]>(initialManual);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [moving, setMoving] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const combined = sortCombined(systemEvents, manualEvents);
  const total = combined.length;

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/horses/${horseId}/events/${id}`, { method: "DELETE" });
    setManualEvents(ev => ev.filter(e => e.id !== id));
    setDeleting(null);
  }

  async function handleMove(item: ManualEvent & { kind: "manual" }, direction: "up" | "down") {
    const idx = combined.findIndex(c => c.kind === "manual" && c.id === item.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const swapItem = combined[swapIdx];
    if (!swapItem || swapItem.kind !== "manual") return;

    setMoving(item.id);

    // Swap (date, order) between the two events
    const [newDateA, newOrderA] = [swapItem.date, swapItem.order];
    const [newDateB, newOrderB] = [item.date, item.order];

    // If orders are equal (e.g. both default 0), resolve by assigning 0 and 1
    const resolvedOrderA = newDateA === newDateB && newOrderA === newOrderB ? 0 : newOrderA;
    const resolvedOrderB = newDateA === newDateB && newOrderA === newOrderB ? 1 : newOrderB;

    const res = await fetch(`/api/horses/${horseId}/events`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        events: [
          { id: item.id,    order: resolvedOrderA, date: newDateA },
          { id: swapItem.id, order: resolvedOrderB, date: newDateB },
        ],
      }),
    });

    if (res.ok) {
      setManualEvents(prev => prev.map(e => {
        if (e.id === item.id)     return { ...e, date: newDateA, order: resolvedOrderA };
        if (e.id === swapItem.id) return { ...e, date: newDateB, order: resolvedOrderB };
        return e;
      }));
    }
    setMoving(null);
  }

  return (
    <>
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 8 }} />
        </div>
      )}

      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: open ? "1px solid var(--border)" : "none" }}>
          <button type="button" onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)", textAlign: "left", flex: 1, padding: 0 }}>
            Timeline
            <span style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: "var(--text-muted)", fontWeight: 400 }}>({total} event{total !== 1 ? "s" : ""})</span>
            <ChevronDown size={20} color="var(--teal)" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }} />
          </button>
          {isAdmin && open && !adding && !editing && (
            <button type="button" onClick={() => setAdding(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--teal)", color: "white", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-lato)", cursor: "pointer", whiteSpace: "nowrap" }}>
              <Plus size={14} /> Add Event
            </button>
          )}
        </div>

        {open && (
          <div style={{ padding: "0 24px 28px", borderTop: "none" }}>
            {adding && (
              <div style={{ marginTop: 16 }}>
                <EventForm horseId={horseId}
                  onSave={ev => { setManualEvents(m => [...m, { ...ev, createdAt: ev.createdAt ?? new Date().toISOString() }]); setAdding(false); }}
                  onCancel={() => setAdding(false)} />
              </div>
            )}

            {total === 0 && !adding ? (
              <p style={{ marginTop: 16, fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>No dated events recorded yet.</p>
            ) : (
              <div style={{ position: "relative", marginTop: 20, paddingLeft: 28 }}>
                <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 2, background: "var(--border)" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {combined.map((ev, i) => {
                    const s = TYPE_STYLE[ev.type] ?? TYPE_STYLE.note;
                    const label = ev.kind === "manual" ? ev.title : ev.label;
                    const sublabel = ev.kind === "manual" ? (ev.description ?? undefined) : ev.sublabel;
                    const imageUrl = ev.kind === "manual" ? ev.imageUrl : ev.imageUrl;
                    const href = ev.kind === "system" ? ev.href : undefined;
                    const isBorn = ev.type === "birth";
                    const isManual = ev.kind === "manual";

                    const prevIsManual = combined[i - 1]?.kind === "manual";
                    const nextIsManual = combined[i + 1]?.kind === "manual";

                    if (isManual && editing === ev.id) {
                      return (
                        <div key={ev.id} style={{ position: "relative" }}>
                          <div style={{ position: "absolute", left: -28, top: 3, width: 16, height: 16, borderRadius: "50%", background: s.dot, border: "3px solid var(--white)", boxShadow: `0 0 0 2px ${s.dot}`, zIndex: 1 }} />
                          <EventForm horseId={horseId} initial={ev as ManualEvent}
                            onSave={updated => { setManualEvents(m => m.map(x => x.id === updated.id ? { ...updated, createdAt: x.createdAt } : x)); setEditing(null); }}
                            onCancel={() => setEditing(null)} />
                        </div>
                      );
                    }

                    return (
                      <div key={isManual ? ev.id : `sys-${i}`} style={{ position: "relative" }}>
                        <div style={{ position: "absolute", left: -28, top: 3, width: 16, height: 16, borderRadius: "50%", background: s.dot, border: "3px solid var(--white)", boxShadow: `0 0 0 2px ${s.dot}`, zIndex: 1 }} />
                        <div style={{ background: "var(--cream)", border: `1px solid ${s.border}`, borderRadius: 8, padding: "10px 14px", fontFamily: "var(--font-lato)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                          {imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imageUrl} alt="" onClick={() => setLightbox(imageUrl!)}
                              style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, flexShrink: 0, border: "1px solid var(--border)", cursor: "zoom-in" }} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmt(ev.date)}</span>
                              <span style={{ fontSize: 10, background: "var(--white)", border: `1px solid ${s.border}`, color: s.dot, borderRadius: 8, padding: "1px 7px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{TYPE_LABELS[ev.type] ?? ev.type}</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                                {href ? <Link href={href} style={{ color: "var(--teal-dark)", textDecoration: "none" }}>{label}</Link> : label}
                              </span>
                            </div>
                            {sublabel && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>{sublabel}</div>}
                          </div>

                          {isAdmin && isManual && !isBorn && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                              <div style={{ display: "flex", gap: 2 }}>
                                <button onClick={() => handleMove(ev as ManualEvent & { kind: "manual" }, "up")}
                                  disabled={!prevIsManual || moving === ev.id}
                                  title="Move up"
                                  style={{ background: "none", border: "none", cursor: prevIsManual ? "pointer" : "default", padding: 3, color: prevIsManual ? "var(--teal)" : "var(--border)", opacity: prevIsManual ? 1 : 0.3 }}>
                                  <ChevronUp size={14} />
                                </button>
                                <button onClick={() => handleMove(ev as ManualEvent & { kind: "manual" }, "down")}
                                  disabled={!nextIsManual || moving === ev.id}
                                  title="Move down"
                                  style={{ background: "none", border: "none", cursor: nextIsManual ? "pointer" : "default", padding: 3, color: nextIsManual ? "var(--teal)" : "var(--border)", opacity: nextIsManual ? 1 : 0.3 }}>
                                  <ChevDown size={14} />
                                </button>
                              </div>
                              <div style={{ display: "flex", gap: 2 }}>
                                <button onClick={() => { setEditing(ev.id); setAdding(false); }} title="Edit"
                                  style={{ background: "none", border: "none", cursor: "pointer", padding: 3, color: "var(--teal)" }}>
                                  <Pencil size={14} />
                                </button>
                                <button onClick={() => handleDelete(ev.id)} disabled={deleting === ev.id} title="Delete"
                                  style={{ background: "none", border: "none", cursor: "pointer", padding: 3, color: "var(--inbreed-text)" }}>
                                  {deleting === ev.id ? <X size={14} /> : <Trash2 size={14} />}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
