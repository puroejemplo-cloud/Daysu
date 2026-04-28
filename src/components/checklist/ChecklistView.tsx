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
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
        {(["salida", "entrada"] as const).map((phase) => {
          const cl = phase === "salida" ? salida : entrada;
          const d = cl.items.filter((i) => i.checked).length;
          const t = cl.items.length;
          const isActive = activeTab === phase;
          return (
            <button key={phase} onClick={() => setActiveTab(phase)}
              className="flex-1 py-2.5 rounded-lg text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              style={{
                background: isActive ? (phase === "salida" ? "#7C3AED" : "var(--gold)") : "transparent",
                color: isActive ? "#fff" : "#94A3B8",
              }}>
              {phase === "salida" ? "🚚" : "📦"} {phase}
              {cl.completedAt
                ? <span className="text-xs opacity-75">✓</span>
                : <span className="text-xs opacity-75">{d}/{t}</span>}
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span style={{ color: "#94A3B8" }}>Progreso {activeTab}</span>
          <span className="font-black" style={{ color: current?.completedAt ? "#22c55e" : activeTab === "salida" ? "#7C3AED" : "var(--gold)" }}>
            {current?.completedAt ? "Completado ✓" : `${done} / ${total} ítems`}
          </span>
        </div>
        <div className="w-full h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: current?.completedAt ? "#22c55e" : activeTab === "salida" ? "#7C3AED" : "var(--gold)" }} />
        </div>
        {current?.completedAt && (
          <p className="text-xs mt-1" style={{ color: "#22c55e" }}>
            Registrado: {format(new Date(current.completedAt), "d MMM yyyy HH:mm'h'", { locale: es })}
          </p>
        )}
      </div>

      {/* Equipo */}
      <div className="aura-card overflow-hidden">
        <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "rgba(124,58,237,.2)" }}>
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: "#7C3AED" }}>📋 Equipo a verificar</span>
        </div>
        <div className="divide-y" style={{ borderColor: "rgba(124,58,237,.08)" }}>
          {equipo.map((item) => (
            <button key={item.id} onClick={() => toggle(item)} disabled={!!current?.completedAt || toggling === item.id}
              className="w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors"
              style={{
                background: item.checked ? "rgba(34,197,94,.06)" : "transparent",
                cursor: current?.completedAt ? "default" : "pointer",
              }}>
              {/* Checkbox */}
              <div className="w-6 h-6 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all"
                style={{
                  borderColor: item.checked ? "#22c55e" : "rgba(255,255,255,.2)",
                  background:  item.checked ? "#22c55e" : "transparent",
                }}>
                {item.checked && <span className="text-xs text-black font-black">✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: item.checked ? "#94A3B8" : "#f5f0e8", textDecoration: item.checked ? "line-through" : "none" }}>
                  {item.label}
                </p>
                {item.checkedAt && (
                  <p className="text-xs mt-0.5" style={{ color: "#22c55e" }}>
                    ✓ {format(new Date(item.checkedAt), "HH:mm'h'", { locale: es })}
                  </p>
                )}
              </div>
              {toggling === item.id && <span className="text-xs" style={{ color: "#94A3B8" }}>...</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Tareas */}
      <div className="aura-card overflow-hidden">
        <div className="px-5 py-3 border-b" style={{ borderColor: "rgba(124,58,237,.2)" }}>
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--gold)" }}>⚡ Tareas de logística</span>
        </div>
        <div className="divide-y" style={{ borderColor: "rgba(124,58,237,.08)" }}>
          {tareas.map((item) => (
            <button key={item.id} onClick={() => toggle(item)} disabled={!!current?.completedAt || toggling === item.id}
              className="w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors"
              style={{ background: item.checked ? "rgba(201,168,76,.06)" : "transparent", cursor: current?.completedAt ? "default" : "pointer" }}>
              <div className="w-6 h-6 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all"
                style={{ borderColor: item.checked ? "var(--gold)" : "rgba(255,255,255,.2)", background: item.checked ? "var(--gold)" : "transparent" }}>
                {item.checked && <span className="text-xs font-black" style={{ color: "#05051a" }}>✓</span>}
              </div>
              <p className="text-sm flex-1" style={{ color: item.checked ? "#94A3B8" : "#f5f0e8", textDecoration: item.checked ? "line-through" : "none" }}>
                {item.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Notas e incidencias */}
      {!current?.completedAt && (
        <div className="aura-card p-5 space-y-3">
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#94A3B8" }}>Notas / Incidencias</p>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Equipo dañado, faltantes, observaciones del montaje..."
            rows={3}
            className="aura-input resize-none" />
        </div>
      )}

      {current?.notes && current.completedAt && (
        <div className="aura-card p-5">
          <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#94A3B8" }}>Notas registradas</p>
          <p className="text-sm text-white">{current.notes}</p>
        </div>
      )}

      {msg && (
        <p className="text-sm font-bold text-center" style={{ color: msg.startsWith("✓") ? "#22c55e" : "#EF4444" }}>{msg}</p>
      )}

      {!current?.completedAt && (
        <button onClick={() => complete(false)} disabled={saving}
          className="w-full py-4 font-black text-base uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
          style={{ background: activeTab === "salida" ? "linear-gradient(135deg,#7C3AED,#9333EA)" : "linear-gradient(135deg,#c9a84c,#D4AF37)", color: activeTab === "salida" ? "#fff" : "#05051a" }}>
          {saving ? "Registrando..." : `✓ Completar fase de ${activeTab}`}
        </button>
      )}
    </div>
  );
}
