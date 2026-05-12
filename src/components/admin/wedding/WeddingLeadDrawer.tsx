"use client";
import { useState } from "react";
import { X, Loader2, UserPlus } from "lucide-react";
import type { WeddingLeadRow } from "./WeddingLeadsTable";

const STATUS_OPTIONS = [
  { value: "new", label: "Nuevo" },
  { value: "contacted", label: "Contactado" },
  { value: "negotiating", label: "En negociación" },
  { value: "confirmed", label: "Confirmado" },
  { value: "discarded", label: "Descartado" },
] as const;

interface Props {
  lead: WeddingLeadRow;
  onClose: () => void;
  onUpdate: (updated: WeddingLeadRow) => void;
}

export function WeddingLeadDrawer({ lead, onClose, onUpdate }: Props) {
  const [status, setStatus] = useState(lead.status);
  const [notes, setNotes] = useState(lead.adminNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/wedding-leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes: notes }),
      });
      const data = await res.json() as { data: WeddingLeadRow };
      onUpdate({ ...lead, ...data.data });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleConvert() {
    if (!confirm(`¿Crear cliente en CRM para ${lead.name}?`)) return;
    setConverting(true);
    try {
      const res = await fetch(`/api/admin/wedding-leads/${lead.id}/convert`, {
        method: "POST",
      });
      const data = await res.json() as { data: { lead: WeddingLeadRow } };
      onUpdate(data.data.lead);
      alert("Cliente creado en CRM correctamente.");
    } catch {
      alert("Error al crear el cliente.");
    } finally {
      setConverting(false);
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          zIndex: 50, backdropFilter: "blur(2px)",
        }}
      />
      {/* Drawer */}
      <div
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: "min(480px, 100vw)",
          background: "#09090b",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          zIndex: 51, overflowY: "auto", padding: "1.5rem",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-lg" style={{ color: "var(--cream)" }}>
              {lead.name}
            </h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {lead.eventType}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent", border: "none",
              color: "var(--muted)", cursor: "pointer",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Datos del lead */}
        <div className="admin-surface rounded-xl p-4 mb-4 space-y-2">
          {[
            ["Email", lead.email],
            ["Teléfono", lead.phone ?? "—"],
            ["Fecha evento", lead.eventDate ? new Date(lead.eventDate).toLocaleDateString("es-MX") : "—"],
            ["Invitados", lead.guestCount?.toString() ?? "—"],
            ["Presupuesto", lead.budget ?? "—"],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <span className="text-xs font-medium w-28 shrink-0" style={{ color: "var(--muted)" }}>
                {label}
              </span>
              <span className="text-sm" style={{ color: "var(--cream)" }}>{value}</span>
            </div>
          ))}
          {lead.message && (
            <div className="pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>Mensaje</p>
              <p className="text-sm" style={{ color: "var(--cream)", lineHeight: 1.6 }}>
                {lead.message}
              </p>
            </div>
          )}
        </div>

        {/* Estado */}
        <div className="mb-4">
          <label className="block text-sm mb-1" style={{ color: "var(--cream)" }}>Estado</label>
          <select
            className="aura-input w-full"
            value={status}
            onChange={(e) => setStatus(e.target.value as WeddingLeadRow["status"])}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Notas internas */}
        <div className="mb-6">
          <label className="block text-sm mb-1" style={{ color: "var(--cream)" }}>
            Notas internas
          </label>
          <textarea
            className="aura-input w-full"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas del seguimiento..."
            style={{ resize: "vertical" }}
          />
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-gold w-full py-3 text-sm rounded-lg"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={15} className="animate-spin" /> Guardando...
              </span>
            ) : saved ? "¡Guardado!" : "Guardar cambios"}
          </button>

          {!lead.clientId && (
            <button
              onClick={handleConvert}
              disabled={converting}
              className="btn-ghost w-full py-3 text-sm rounded-lg flex items-center justify-center gap-2"
            >
              {converting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <UserPlus size={15} />
              )}
              Crear cliente en CRM
            </button>
          )}

          {lead.clientId && (
            <a
              href={`/admin/clientes/${lead.clientId}`}
              className="btn-ghost w-full py-3 text-sm rounded-lg text-center"
              style={{ textDecoration: "none" }}
            >
              Ver perfil CRM →
            </a>
          )}
        </div>
      </div>
    </>
  );
}
