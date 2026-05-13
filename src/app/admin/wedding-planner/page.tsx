"use client";
import { useState, useEffect, useCallback } from "react";
import { WeddingLeadsTable, type WeddingLeadRow } from "@/components/admin/wedding/WeddingLeadsTable";
import { WeddingPlannerConfig } from "@/components/admin/wedding/WeddingPlannerConfig";

type Tab = "leads" | "config";

interface WpSettings {
  wp_event_types: string[];
  wp_gallery_images: string[];
  wp_testimonials: { name: string; eventType: string; text: string }[];
  wp_hero_subtitle: string;
  wp_hero_image:    string | null;
  wp_planner_photo: string | null;
  wp_steps: { title: string; desc: string }[];
}

export default function WeddingPlannerPage() {
  const [tab, setTab] = useState<Tab>("leads");
  const [leads, setLeads] = useState<WeddingLeadRow[]>([]);
  const [settings, setSettings] = useState<WpSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    const res = await fetch("/api/admin/wedding-leads");
    const data = await res.json() as { data: WeddingLeadRow[] };
    setLeads(data.data);
  }, []);

  const fetchSettings = useCallback(async () => {
    const res = await fetch("/api/admin/wedding-planner/settings");
    const data = await res.json() as { data: WpSettings };
    setSettings(data.data);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchLeads(), fetchSettings()]).finally(() => setLoading(false));
  }, [fetchLeads, fetchSettings]);

  function handleLeadUpdate(updated: WeddingLeadRow) {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <p className="admin-label">Marketing</p>
        <h1 className="admin-page-title">Wedding Planner</h1>
        <p className="admin-page-desc">
          Gestiona los leads del servicio de planeación y configura el contenido de la página pública.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 mb-8" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0" }}>
        {(["leads", "config"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: tab === t ? 500 : 400,
              color: tab === t ? "var(--gold)" : "var(--muted)",
              borderBottom: tab === t ? "2px solid var(--gold)" : "2px solid transparent",
              marginBottom: "-1px",
              transition: "color 0.15s",
            }}
          >
            {t === "leads" ? `Leads (${leads.length})` : "Configuración"}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)" }} className="text-sm">Cargando...</p>
      ) : (
        <>
          {tab === "leads" && (
            <WeddingLeadsTable leads={leads} onUpdate={handleLeadUpdate} />
          )}
          {tab === "config" && settings && (
            <WeddingPlannerConfig initial={settings} />
          )}
        </>
      )}
    </div>
  );
}
