"use client";
import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ChecklistItem {
  id: number; label: string; category: string;
  checked: boolean; checkedAt: string | null; sortOrder: number;
}
interface Checklist {
  id: number; phase: string; completedAt: string | null; notes: string | null;
  items: ChecklistItem[];
}

export default function ChecklistView({ bookingId }: { bookingId: string }) {
  const [salida, setSalida]   = useState<Checklist | null>(null);
  const [entrada, setEntrada] = useState<Checklist | null>(null);
  const [activeTab, setActiveTab] = useState<"salida" | "entrada">("salida");
  const [notes, setNotes]     = useState("");
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState("");
  const [toggling, setToggling] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/checklists?booking_id=${bookingId}`);
    const json = await res.json();
    if (json.data) {
      setSalida(json.data.salida);
      setEntrada(json.data.entrada);
    }
  }, [bookingId]);

  useEffect(() => { load(); }, [load]);

  const current = activeTab === "salida" ? salida : entrada;
  const setCurrent = activeTab === "salida" ? setSalida : setEntrada;

  const toggle = async (item: ChecklistItem) => {
    if (!current || current.completedAt) return;
    setToggling(item.id);
    const res = await fetch(`/api/checklists/${current.id}/items/${item.id}`, { method: "PATCH" });
    const json = await res.json();
    if (res.ok) {
      setCurrent((prev) => prev ? {
        ...prev,
        items: prev.items.map((i) => i.id === item.id ? json.data : i),
      } : prev);
    }
    setToggling(null);
  };

  const complete = async (force = false) => {
    if (!current) return;
    setSaving(true); setMsg("");
    const url = `/api/checklists/${current.id}/complete`;
    const res = await fetch(url, {
      method: force ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    const json = await res.json();
    if (res.ok) {
      setCurrent(json.data);
      setMsg("✓ Fase completada y registrada.");
    } else if (res.status === 422) {
      // Hay ítems sin marcar — preguntar si forzar
      if (confirm(`${json.error}\n\n¿Completar de todas formas?`)) {
        await complete(true);
      }
    } else {
      setMsg(json.error);
    }
    setSaving(false);
  };

  if (!salida || !entrada) return (
    <div className="text-center py-16" style={{ color: "#94A3B8" }}>Cargando checklist...</div>
  );

  const equipo = current?.items.filter((i) => i.category === "equipo") ?? [];
  const tareas = current?.items.filter((i) => i.category === "tarea") ?? [];
  const done   = current?.items.filter((i) => i.checked).length ?? 0;
  const total  = current?.items.length ?? 0;
  const pct    = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {(["salida", "entrada"] as const).map((phase) => {
          const cl = phase === "salida" ? salida : entrada;
          const d = cl.items.filter((i) => i.checked).length;
          const t = cl.items.length;
          const isActive = activeTab === phase;
          return (
            <button key={phase} onClick={() => setActiveTab(phase)}
              className="flex-1 py-2 rounded-md text-xs font-semibold uppercase tracking-wide transition-all flex items-center justify-center gap-2"
              style={{
                background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                color: isActive ? "#e4e4e7" : "#52525b",
                border: isActive ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
              }}>
              {phase === "salida" ? "Salida" : "Entrada"}
              <span className="opacity-60">{cl.completedAt ? "✓" : `${d}/${t}`}</span>
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs mb-2">
          <span className="admin-label">Progreso {activeTab}</span>
          <span className="font-semibold" style={{ color: current?.completedAt ? "#16a34a" : "#a1a1aa" }}>
            {current?.completedAt ? "Completado" : `${done} / ${total}`}
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: current?.completedAt ? "#16a34a" : "#d4af37" }} />
        </div>
        {current?.completedAt && (
          <p className="text-xs mt-1" style={{ color: "#52525b" }}>
            {format(new Date(current.completedAt), "d MMM yyyy · HH:mm'h'", { locale: es })}
          </p>
        )}
      </div>

      {/* Equipo */}
      <div className="aura-card overflow-hidden">
        <div className="px-5 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <span className="admin-label">Equipo a verificar</span>
        </div>
        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          {equipo.map((item) => (
            <button key={item.id} onClick={() => toggle(item)} disabled={!!current?.completedAt || toggling === item.id}
              className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors"
              style={{ background: "transparent", cursor: current?.completedAt ? "default" : "pointer" }}>
              <div className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border transition-all"
                style={{
                  borderColor: item.checked ? "#16a34a" : "rgba(255,255,255,0.15)",
                  background:  item.checked ? "#16a34a" : "transparent",
                }}>
                {item.checked && <span style={{ fontSize: "0.6rem", color: "#fff", fontWeight: 700 }}>✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: item.checked ? "#52525b" : "#d4d4d8", textDecoration: item.checked ? "line-through" : "none" }}>
                  {item.label}
                </p>
                {item.checkedAt && (
                  <p className="text-xs mt-0.5" style={{ color: "#3f3f46" }}>
                    {format(new Date(item.checkedAt), "HH:mm'h'", { locale: es })}
                  </p>
                )}
              </div>
              {toggling === item.id && <span style={{ fontSize: "0.7rem", color: "#52525b" }}>…</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Tareas */}
      <div className="aura-card overflow-hidden">
        <div className="px-5 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <span className="admin-label">Tareas de logística</span>
        </div>
        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          {tareas.map((item) => (
            <button key={item.id} onClick={() => toggle(item)} disabled={!!current?.completedAt || toggling === item.id}
              className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors"
              style={{ background: "transparent", cursor: current?.completedAt ? "default" : "pointer" }}>
              <div className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border transition-all"
                style={{ borderColor: item.checked ? "#d4af37" : "rgba(255,255,255,0.15)", background: item.checked ? "#d4af37" : "transparent" }}>
                {item.checked && <span style={{ fontSize: "0.6rem", color: "#05051a", fontWeight: 700 }}>✓</span>}
              </div>
              <p className="text-sm flex-1" style={{ color: item.checked ? "#52525b" : "#d4d4d8", textDecoration: item.checked ? "line-through" : "none" }}>
                {item.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {!current?.completedAt && (
        <div className="aura-card p-4 space-y-3">
          <p className="admin-label">Notas / Incidencias</p>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Equipo dañado, faltantes, observaciones..."
            rows={3} className="aura-input resize-none" />
        </div>
      )}

      {current?.notes && current.completedAt && (
        <div className="aura-card p-4">
          <p className="admin-label mb-2">Notas registradas</p>
          <p className="text-sm" style={{ color: "#a1a1aa" }}>{current.notes}</p>
        </div>
      )}

      {msg && (
        <p className="text-sm text-center" style={{ color: msg.startsWith("✓") ? "#4ade80" : "#f87171" }}>{msg}</p>
      )}

      {!current?.completedAt && (
        <button onClick={() => complete(false)} disabled={saving}
          className="w-full py-3 font-semibold text-sm rounded-lg transition-all disabled:opacity-50"
          style={{ background: "rgba(255,255,255,0.07)", color: "#e4e4e7", border: "1px solid rgba(255,255,255,0.1)" }}>
          {saving ? "Registrando..." : `Completar fase de ${activeTab}`}
        </button>
      )}
    </div>
  );
}
