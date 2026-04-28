"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import {
  Package, PlusCircle, Users, CheckSquare, Bell, Images,
  CalendarDays, Eye,
} from "lucide-react";
import NotificationPermission from "@/components/ui/NotificationPermission";

interface Booking {
  id: string; eventName: string; status: string;
  setupAt: string; expiresAt: string | null;
  totalAmount: string; depositAmount: string;
  client: { fullName: string; email: string };
  notifications: { type: string; isRead: boolean; createdAt: string }[];
}

interface Toast { id: number; message: string; type: "success" | "error" }

const ST: Record<string, { label: string; bg: string; color: string }> = {
  pending_payment: { label: "Pendiente pago", bg: "rgba(212,175,55,.12)",  color: "#D4AF37" },
  confirmed:       { label: "Confirmada",     bg: "rgba(22,163,74,.12)",   color: "#22c55e" },
  expired:         { label: "Vencida",        bg: "rgba(239,68,68,.12)",   color: "#EF4444" },
  cancelled:       { label: "Cancelada",      bg: "rgba(100,116,139,.12)", color: "#64748B" },
  in_progress:     { label: "En curso",       bg: "rgba(124,58,237,.12)",  color: "#9333EA" },
  completed:       { label: "Completada",     bg: "rgba(100,116,139,.12)", color: "#64748B" },
};

const ACTION_STATUS: Record<"confirm" | "cancel", string> = {
  confirm: "confirmed",
  cancel:  "cancelled",
};

type FilterKey = "all" | "pending_payment" | "confirmed" | "expired";

let toastId = 0;

export default function AdminDashboard() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const initialFilter = (searchParams.get("status") ?? "pending_payment") as FilterKey;
  const [bookings,  setBookings]  = useState<Booking[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<FilterKey>(initialFilter);
  const [acting,    setActing]    = useState<string | null>(null);
  const [toasts,    setToasts]    = useState<Toast[]>([]);
  const [lastSync,  setLastSync]  = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const qs = filter === "all" ? "" : `?status=${filter}`;
    const res = await fetch(`/api/bookings${qs}`);
    const json = await res.json();
    setBookings(json.data ?? []);
    setLastSync(new Date());
    if (!silent) setLoading(false);
  }, [filter]);

  // load() es async — los setState internos ocurren después del tick de la función.
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    load();
    intervalRef.current = setInterval(() => load(true), 60_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [load]);

  // Persistir filtro en URL
  const setFilterAndUrl = useCallback((f: FilterKey) => {
    setFilter(f);
    const params = new URLSearchParams(searchParams.toString());
    if (f === "pending_payment") {
      params.delete("status");
    } else {
      params.set("status", f);
    }
    router.replace(`/admin?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const act = async (id: string, action: "confirm" | "cancel") => {
    setActing(id);
    // Actualización optimista
    const newStatus = ACTION_STATUS[action];
    setBookings((prev) =>
      prev.map((b) => b.id === id ? { ...b, status: newStatus } : b)
    );
    try {
      const res = await fetch(`/api/bookings/${id}/${action}`, { method: "POST" });
      if (!res.ok) throw new Error();
      addToast(action === "confirm" ? "✓ Pago confirmado correctamente" : "Reserva cancelada", action === "confirm" ? "success" : "error");
      await load(true);
    } catch {
      // Revert optimistic update on failure
      addToast("Error al procesar la acción. Intenta de nuevo.", "error");
      await load(true);
    } finally {
      setActing(null);
    }
  };

  const pending   = bookings.filter((b) => b.status === "pending_payment").length;
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const unread    = bookings.reduce((n, b) => n + b.notifications.filter((n) => !n.isRead).length, 0);

  return (
    <div className="space-y-6">
      {/* ── TOASTS ─────────────────────────────────────────── */}
      <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9999, display: "flex", flexDirection: "column", gap: "0.5rem", pointerEvents: "none" }}
        aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} role="status"
            style={{
              padding: "0.75rem 1.25rem",
              borderRadius: 12,
              fontSize: "0.85rem",
              fontWeight: 700,
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              background: t.type === "success" ? "rgba(22,163,74,.9)" : "rgba(239,68,68,.9)",
              color: "#fff",
              backdropFilter: "blur(8px)",
              animation: "fadeUp 0.25s ease both",
              pointerEvents: "auto",
            }}>
            {t.message}
          </div>
        ))}
      </div>

      <NotificationPermission />

      {/* ── ACCESOS RÁPIDOS ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        {[
          { href: "/admin/productos",     Icon: Package,      label: "Gestionar\nProductos",   color: "#f59e0b", bg: "rgba(245,158,11,.12)"  },
          { href: "/admin/ventas/nueva",  Icon: PlusCircle,   label: "Nueva\nVenta",           color: "#22c55e", bg: "rgba(34,197,94,.12)"   },
          { href: "/admin/clientes",      Icon: Users,        label: "CRM\nClientes",          color: "#38bdf8", bg: "rgba(56,189,248,.12)"  },
          { href: "/admin/checklists",    Icon: CheckSquare,  label: "Checklists\nLogística",  color: "#a78bfa", bg: "rgba(167,139,250,.12)" },
          { href: "/admin/recordatorios", Icon: Bell,         label: "Fechas\nEspeciales",     color: "#f472b6", bg: "rgba(244,114,182,.12)" },
          { href: "/admin/galeria",       Icon: Images,       label: "Galería\nDifuminado",    color: "#e879f9", bg: "rgba(232,121,249,.12)" },
          { href: "/admin/calendario",    Icon: CalendarDays, label: "Calendario\nEventos",    color: "#38bdf8", bg: "rgba(56,189,248,.12)"  },
          { href: "/catalogo",            Icon: Eye,          label: "Ver\nCatálogo",          color: "#94a3b8", bg: "rgba(148,163,184,.08)" },
        ].map((item) => (
          <Link key={item.href} href={item.href}
            className="aura-card flex flex-col items-center justify-center gap-2 p-4 text-center transition-all hover:scale-105 active:scale-95"
            style={{ textDecoration: "none", background: item.bg, borderColor: item.color + "40", minHeight: 90 }}>
            <item.Icon size={22} style={{ color: item.color }} aria-hidden="true" />
            <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: item.color, whiteSpace: "pre-line", lineHeight: 1.3 }}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Holds activos",  value: pending,         color: "#D4AF37" },
          { label: "Confirmadas",    value: confirmed,       color: "#22c55e" },
          { label: "Sin leer",       value: unread,          color: "#EF4444" },
          { label: "Total visibles", value: bookings.length, color: "#9333EA" },
        ].map((s) => (
          <div key={s.label} className="aura-card p-5 text-center">
            <p className="text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: "#475569" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros + indicador de sincronización */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div className="flex gap-2 flex-wrap" role="group" aria-label="Filtrar reservas por estado">
          {(["pending_payment", "confirmed", "expired", "all"] as FilterKey[]).map((f) => (
            <button key={f} onClick={() => setFilterAndUrl(f)}
              aria-pressed={filter === f}
              className="px-4 py-1.5 rounded-full text-sm font-bold border transition-all"
              style={{
                background: filter === f ? "linear-gradient(135deg,#7C3AED,#9333EA)" : "transparent",
                borderColor: filter === f ? "#7C3AED" : "rgba(124,58,237,.3)",
                color: filter === f ? "#fff" : "#94A3B8",
              }}>
              {f === "all" ? "Todas" : ST[f]?.label ?? f}
            </button>
          ))}
        </div>
        {lastSync && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button onClick={() => load()} title="Actualizar ahora"
              style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: "0.3rem 0.75rem", color: "#475569", fontSize: "0.72rem", cursor: "pointer", transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#94a3b8")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}>
              ↻ Actualizar
            </button>
            <span style={{ fontSize: "0.7rem", color: "#334155" }}>
              Sincronizado {formatDistanceToNow(lastSync, { locale: es, addSuffix: true })}
            </span>
          </div>
        )}
      </div>

      {/* Lista */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 96, borderRadius: 12 }} />
          ))}
        </div>
      )}
      {!loading && bookings.length === 0 && (
        <div className="text-center py-16" style={{ color: "#475569" }}>No hay reservas con este filtro.</div>
      )}

      {!loading && (
        <div className="space-y-3">
          {bookings.map((b) => {
            const s         = ST[b.status] ?? { label: b.status, bg: "rgba(100,116,139,.1)", color: "#64748B" };
            const isExpired = b.expiresAt && new Date(b.expiresAt) < new Date();
            const isActing  = acting === b.id;
            return (
              <div key={b.id} className="aura-card p-5 flex flex-col md:flex-row md:items-center gap-4"
                style={{ opacity: isActing ? 0.7 : 1, transition: "opacity 0.2s" }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Link href={`/reserva/${b.id}`} className="font-black text-white hover:text-[#D4AF37] transition-colors truncate">
                      {b.eventName}
                    </Link>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                      style={{ background: s.bg, color: s.color }}>
                      {s.label}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: "#94A3B8" }}>
                    {b.client.fullName} · {b.client.email}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#475569" }}>
                    📅 {format(new Date(b.setupAt), "d MMM yyyy HH:mm'h'", { locale: es })}
                    {b.expiresAt && b.status === "pending_payment" && (
                      <span className="ml-2 font-bold" style={{ color: isExpired ? "#EF4444" : "#D4AF37" }}>
                        · Vence {formatDistanceToNow(new Date(b.expiresAt), { locale: es, addSuffix: true })}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="font-black" style={{ color: "#D4AF37" }}>${Number(b.depositAmount).toFixed(2)}</p>
                    <p className="text-xs" style={{ color: "#475569" }}>apartado</p>
                  </div>
                  {b.status === "pending_payment" && (
                    <>
                      <button onClick={() => act(b.id, "confirm")} disabled={isActing}
                        aria-label={`Confirmar pago de ${b.eventName}`}
                        className="text-xs font-black px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                        style={{ background: "rgba(22,163,74,.15)", color: "#22c55e", border: "1px solid rgba(22,163,74,.3)" }}>
                        {isActing ? "..." : "✓ Confirmar pago"}
                      </button>
                      <button onClick={() => act(b.id, "cancel")} disabled={isActing}
                        aria-label={`Cancelar reserva ${b.eventName}`}
                        className="text-xs font-black px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                        style={{ background: "rgba(239,68,68,.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,.3)" }}>
                        ✕ Cancelar
                      </button>
                    </>
                  )}
                  {b.status === "confirmed" && (
                    <button onClick={() => act(b.id, "cancel")} disabled={isActing}
                      aria-label={`Cancelar reserva confirmada ${b.eventName}`}
                      className="text-xs font-black px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                      style={{ background: "rgba(239,68,68,.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,.3)" }}>
                      ✕ Cancelar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
