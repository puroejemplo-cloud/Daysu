"use client";
import { useState } from "react";
import { WeddingLeadDrawer } from "./WeddingLeadDrawer";

export interface WeddingLeadRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  eventType: string;
  eventDate: string | null;
  guestCount: number | null;
  budget: string | null;
  message: string | null;
  status: "new" | "contacted" | "negotiating" | "confirmed" | "discarded";
  adminNotes: string | null;
  clientId: number | null;
  createdAt: string;
  client: { id: number; fullName: string } | null;
}

const STATUS_LABELS: Record<WeddingLeadRow["status"], string> = {
  new: "Nuevo",
  contacted: "Contactado",
  negotiating: "En negociación",
  confirmed: "Confirmado",
  discarded: "Descartado",
};

const STATUS_COLORS: Record<WeddingLeadRow["status"], string> = {
  new: "#E8198A",
  contacted: "#3b82f6",
  negotiating: "#f59e0b",
  confirmed: "#22c55e",
  discarded: "#6b7280",
};

interface Props {
  leads: WeddingLeadRow[];
  onUpdate: (updated: WeddingLeadRow) => void;
}

export function WeddingLeadsTable({ leads, onUpdate }: Props) {
  const [selected, setSelected] = useState<WeddingLeadRow | null>(null);
  const [filterStatus, setFilterStatus] = useState<WeddingLeadRow["status"] | "all">("all");

  const filtered = filterStatus === "all" ? leads : leads.filter((l) => l.status === filterStatus);

  return (
    <div>
      {/* Filtros de estado */}
      <div className="flex gap-2 flex-wrap mb-4">
        {(["all", "new", "contacted", "negotiating", "confirmed", "discarded"] as const).map(
          (s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="admin-badge"
              style={{
                cursor: "pointer",
                opacity: filterStatus === s ? 1 : 0.45,
                background: s === "all" ? "rgba(255,255,255,0.08)" : `${STATUS_COLORS[s] ?? "#888"}22`,
                color: s === "all" ? "var(--cream)" : STATUS_COLORS[s] ?? "#888",
                border: `1px solid ${s === "all" ? "rgba(255,255,255,0.1)" : STATUS_COLORS[s] ?? "#888"}44`,
              }}
            >
              {s === "all" ? "Todos" : STATUS_LABELS[s]}
            </button>
          )
        )}
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: "var(--muted)" }} className="text-sm py-8 text-center">
          No hay leads con este filtro.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                {["Nombre", "Evento", "Fecha evento", "Invitados", "Estado", "Recibido"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left", padding: "0.5rem 0.75rem",
                        fontSize: "0.75rem", color: "var(--muted)", fontWeight: 500,
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => setSelected(lead)}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.03)")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "0.75rem", color: "var(--cream)", fontSize: "0.875rem" }}>
                    <p className="font-medium">{lead.name}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{lead.email}</p>
                  </td>
                  <td style={{ padding: "0.75rem", color: "var(--cream)", fontSize: "0.875rem" }}>
                    {lead.eventType}
                  </td>
                  <td style={{ padding: "0.75rem", color: "var(--muted)", fontSize: "0.875rem" }}>
                    {lead.eventDate ? new Date(lead.eventDate).toLocaleDateString("es-MX") : "—"}
                  </td>
                  <td style={{ padding: "0.75rem", color: "var(--muted)", fontSize: "0.875rem" }}>
                    {lead.guestCount ?? "—"}
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <span
                      className="admin-badge"
                      style={{
                        background: `${STATUS_COLORS[lead.status]}22`,
                        color: STATUS_COLORS[lead.status],
                        border: `1px solid ${STATUS_COLORS[lead.status]}44`,
                      }}
                    >
                      {STATUS_LABELS[lead.status]}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem", color: "var(--muted)", fontSize: "0.75rem" }}>
                    {new Date(lead.createdAt).toLocaleDateString("es-MX")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <WeddingLeadDrawer
          lead={selected}
          onClose={() => setSelected(null)}
          onUpdate={(updated) => {
            onUpdate(updated);
            setSelected(updated);
          }}
        />
      )}
    </div>
  );
}
