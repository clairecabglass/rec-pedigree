"use client";
import { useState } from "react";
import VideoUploader from "./VideoUploader";

interface Video { id: string; url: string; caption: string | null; mimeType: string | null; }

export default function VideoManager({ horseId, initial }: { horseId: string; initial: Video[] }) {
  const [videos, setVideos] = useState<Video[]>(initial);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function remove(videoId: string) {
    setDeleting(videoId);
    await fetch(`/api/horses/${horseId}/videos?videoId=${videoId}`, { method: "DELETE" });
    setVideos((v) => v.filter((x) => x.id !== videoId));
    setDeleting(null);
  }

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {videos.map((v) => (
          <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", background: "var(--cream)" }}>
            <video
              src={v.url}
              style={{ width: 80, height: 52, objectFit: "cover", borderRadius: 4, background: "#1A1A1A" }}
              muted
              preload="metadata"
              onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).currentTime = 1; }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <a href={v.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--teal)", fontFamily: "var(--font-lato)", wordBreak: "break-all", textDecoration: "none" }}>
                {v.url.split("/").pop()}
              </a>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>{v.mimeType ?? "video"}</div>
            </div>
            <button
              onClick={() => remove(v.id)}
              disabled={deleting === v.id}
              style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "#C05050", cursor: "pointer", fontFamily: "var(--font-lato)" }}
            >
              {deleting === v.id ? "…" : "Remove"}
            </button>
          </div>
        ))}
        {videos.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>No videos yet.</p>
        )}
      </div>
      <VideoUploader horseId={horseId} onUploaded={(v) => setVideos((prev) => [...prev, v])} />
      <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)", marginTop: 8, lineHeight: 1.5 }}>
        Supported: MP4, WebM, MOV, AVI · Files over 100 MB are compressed in your browser before upload.
      </p>
    </div>
  );
}
