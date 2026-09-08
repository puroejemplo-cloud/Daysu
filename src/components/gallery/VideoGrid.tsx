"use client";
import { useState } from "react";
import { Play } from "lucide-react";

interface VideoItem {
  id: number;
  youtubeId: string;
  title: string | null;
  eventType: string | null;
  packageName: string | null;
}

function VideoCard({ video }: { video: VideoItem }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div style={{
      borderRadius: 12,
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.06)",
      background: "#0d0d1a",
    }}>
      <div style={{ position: "relative", aspectRatio: "16/9", background: "#000" }}>
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
            title={video.title ?? "Video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: "100%", height: "100%", border: 0, display: "block" }}
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            aria-label={`Reproducir video${video.title ? `: ${video.title}` : ""}`}
            style={{ position: "absolute", inset: 0, border: 0, padding: 0, cursor: "pointer", background: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
              alt={video.title ?? "Video del evento"}
              loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "rgba(232,25,138,0.9)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              }}>
                <Play size={22} color="#fff" fill="#fff" style={{ marginLeft: 3 }} />
              </div>
            </div>
          </button>
        )}
      </div>
      {(video.eventType || video.packageName || video.title) && (
        <div style={{ padding: "0.65rem 0.85rem" }}>
          {video.title && (
            <p style={{ color: "#e4e4e7", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.35rem" }}>{video.title}</p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
            {video.eventType && (
              <span style={{ fontSize: "0.62rem", fontWeight: 700, padding: "0.15rem 0.55rem", borderRadius: 999, background: "rgba(232,25,138,.12)", color: "var(--gold)" }}>
                {video.eventType}
              </span>
            )}
            {video.packageName && (
              <span style={{ fontSize: "0.62rem", fontWeight: 700, padding: "0.15rem 0.55rem", borderRadius: 999, background: "rgba(124,58,237,.12)", color: "#a78bfa" }}>
                {video.packageName}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VideoGrid({ videos }: { videos: VideoItem[] }) {
  if (videos.length === 0) return null;
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      gap: "0.85rem",
    }}>
      {videos.map((v) => <VideoCard key={v.id} video={v} />)}
    </div>
  );
}
