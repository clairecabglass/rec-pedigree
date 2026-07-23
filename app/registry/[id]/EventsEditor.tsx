"use client";
import { useState, useRef } from "react";
import { ChevronDown, Plus, Pencil, Trash2, X } from "lucide-react";

const EVENT_TYPES = ["training", "health", "competition", "milestone", "note"];
const TYPE_LABELS: Record<string, string> = {
  training: "Training", health: "Health / Vet", competition: "Competition",
  milestone: "Milestone", note: "Note",
};

export interface ManualEvent {
  id: string; horseId: string; date: string; title: string;
  description: string | null; type: string; imageUrl: string | null;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", border: "1px solid var(--border)",
  borderRadius: 6, fontSize: 13, fontFamily: "var(--font-lato)",
  color: "var(--text)", background: "var(--white)",
};

function EventForm({
  horseId, initial, onSave, onCancel,
}: {
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
    <form onSubmit={submit} style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
      <div className="grid md:grid-cols-2 gap-3" style={{ marginBottom: 10 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "var(--teal-dark)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Title *</label>
          <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. First canter session" />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "var(--teal-dark)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Date *</label>
          <input type="date" style={inputStyle} value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--teal-dark)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Type</label>
        <select style={inputStyle} value={type} onChange={e => setType(e.target.value)}>
          {EVENT_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--teal-dark)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Notes</label>
        <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional details…" />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--teal-dark)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Photo</label>
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

export default function EventsEditor({ horseId, initial }: { horseId: string; initial: ManualEvent[] }) {
  const [events, setEvents] = useState<ManualEvent[]>(initial);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/horses/${horseId}/events/${id}`, { method: "DELETE" });
    setEvents(ev => ev.filter(e => e.id !== id));
    setDeleting(null);
  }

  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", marginTop: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: open ? "1px solid var(--border)" : "none" }}>
        <button type="button" onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)", textAlign: "left", flex: 1, padding: 0 }}>
          Manage Events
          <span style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: "var(--text-muted)", fontWeight: 400 }}>({events.length})</span>
          <ChevronDown size={20} color="var(--teal)" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }} />
        </button>
        {open && !adding && (
          <button type="button" onClick={() => { setAdding(true); setEditing(null); }}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--teal)", color: "white", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-lato)", cursor: "pointer", whiteSpace: "nowrap" }}>
            <Plus size={14} /> Add Event
          </button>
        )}
      </div>

      {open && (
        <div style={{ padding: 24 }}>
          {adding && (
            <div style={{ marginBottom: 16 }}>
              <EventForm horseId={horseId} onSave={ev => { setEvents(e => [...e, ev].sort((a, b) => a.date.localeCompare(b.date))); setAdding(false); }} onCancel={() => setAdding(false)} />
            </div>
          )}

          {events.length === 0 && !adding && (
            <p style={{ color: "var(--text-muted)", fontSize: 14, fontFamily: "var(--font-lato)" }}>No events recorded yet.</p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {events.map(ev => (
              <div key={ev.id}>
                {editing === ev.id ? (
                  <EventForm horseId={horseId} initial={ev}
                    onSave={updated => { setEvents(e => e.map(x => x.id === updated.id ? updated : x)); setEditing(null); }}
                    onCancel={() => setEditing(null)} />
                ) : (
                  <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", background: "var(--cream)", display: "flex", gap: 12, alignItems: "flex-start" }}>
                    {ev.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ev.imageUrl} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, flexShrink: 0, border: "1px solid var(--border)" }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{new Date(ev.date).toLocaleDateString("en-GB")}</span>
                        <span style={{ fontSize: 10, background: "var(--teal-muted)", color: "var(--teal-dark)", borderRadius: 10, padding: "1px 8px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "var(--font-lato)" }}>{TYPE_LABELS[ev.type] ?? ev.type}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-lato)" }}>{ev.title}</span>
                      </div>
                      {ev.description && <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0", fontFamily: "var(--font-lato)", lineHeight: 1.5 }}>{ev.description}</p>}
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button onClick={() => { setEditing(ev.id); setAdding(false); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--teal)" }} title="Edit"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(ev.id)} disabled={deleting === ev.id} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--inbreed-text)" }} title="Delete">
                        {deleting === ev.id ? <X size={15} /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
