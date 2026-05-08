"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import {
  Package, PlusCircle, Users, CheckSquare, Bell, Images,
  CalendarDays, Eye, RefreshCw,
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

const ST: Record<string, { label: string; color: string; dot: string }> = {
  pending_payment: { label: "Pendiente pago", color: "#a16207", dot: "#ca8a04" },
  confirmed:       { label: "Confirmada",     color: "#166534", dot: "#16a34a" },
  expired:         { label: "Vencida",        color: "#991b1b", dot: "#dc2626" },
  cancelled:       { label: "Cancelada",      color: "#374151", dot: "#6b7280" },
  in_progress:     { label: "En curso",       color: "#1e3a5f", dot: "#3b82f6" },
  completed:       { label: "Completada",     color: "#374151", dot: "#6b7280" },
};

const ACTION_STATUS: Record<"confirm" | "cancel", string> = {
  confirm: "confirmed",
  cancel:  "cancelled",
};

type FilterKey = "all" | "pending_payment" | "confirmed" | "in_progress" | "completed" | "cancelled" | "expired";

let toastId = 0;

const QUICK_LINKS = [
  { href: "/admin/productos",     Icon: Package,      label: "Productos"      },
  { href: "/admin/ventas/nueva",  Icon: PlusCircle,   label: "Nueva venta"    },
  { href: "/admin/clientes",      Icon: Users,        label: "Clientes"       },
  { href: "/admin/checklists",    Icon: CheckSquare,  label: "Checklists"     },
  { href: "/admin/recordatorios", Icon: Bell,         label: "Recordatorios"  },
  { href: "/admin/galeria",       Icon: Images,       label: "Galería"        },
  { href: "/admin/calendario",    Icon: CalendarDays, label: "Calendario"     },
  { href: "/catalogo",            Icon: Eye,          label: "Ver catálogo"   },
];

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

  useEffect(() => {
    load();
    intervalRef.current = setInterval(() => load(true), 60_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [load]);

  const setFilterAndUrl = useCallback((f: FilterKey) => {
    setFilter(f);
    const params = new URLSearchParams(searchParams.toString());
    if (f === "pending_payment") params.delete("status");
    else params.set("status", f);
    router.replace(`/admin?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const act = async (id: string, action: "confirm" | "cancel") => {
    setActing(id);
    const newStatus = ACTION_STATUS[action];
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: newStatus } : b));
    try {
      const res = await fetch(`/api/bookings/${id}/${action}`, { method: "POST" });
      if (!res.ok) throw new Error();
      addToast(action === "confirm" ? "Pago confirmado" : "Reserva cancelada", action === "confirm" ? "success" : "error");
      await load(true);
    } catch {
      addToast("Error al procesar. Intenta de nuevo.", "error");
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
      {/* Toasts */}
      <div style={{ position: "fixed", bottom: "2rem", right: "2rem", zIndex: 9999, display: "flex", flexDirection: "column", gap: "0.5rem", pointerEvents: "none" }}
        aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} role="status"
            style={{
              padding: "0.7rem 1.2rem",
              borderRadius: 8,
              fontSize: "0.82rem",
              fontWeight: 500,
              background: t.type === "success" ? "#14532d" : "#450a0a",
              border: `1px solid ${t.type === "success" ? "rgba(22,163,74,.3)" : "rgba(220,38,38,.3)"}`,
              color: t.type === "success" ? "#86efac" : "#fca5a5",
              pointerEvents: "auto",
            }}>
            {t.message}
          </div>
        ))}
      </div>

      <NotificationPermission />

      {/* Accesos rápidos */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
        {QUICK_LINKS.map((item) => (
          <Link key={item.href} href={item.href}
            className="aura-card flex flex-col items-center justify-center gap-2.5 p-4 text-center hover:border-white/15 transition-all active:scale-95"
            style={{ textDecoration: "none", minHeight: 90 }}>
            <item.Icon size={18} style={{ color: "#71717a" }} aria-hidden="true" />
            <span style={{ fontSize: "0.65rem", fontWeight: 500, color: "#52525b", lineHeight: 1.35 }}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Stats — número ligero, espaciado generoso */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Holds activos",  value: pending,         accent: "#ca8a04" },
          { label: "Confirmadas",    value: confirmed,       accent: "#16a34a" },
          { label: "Sin leer",       value: unread,          accent: "#dc2626" },
          { label: "Total visibles", value: bookings.length, accent: "#71717a" },
        ].map((s) => (
          <div key={s.label} className="aura-card p-6">
            <p style={{ fontSize: "2.5rem", fontWeight: 300, letterSpacing: "-0.04em", color: s.accent, lineHeight: 1 }}>
              {s.value}
            </p>
            <p className="admin-label mt-3">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.6rem" }}>
        <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Filtrar por estado">
          {(["pending_payment", "confirmed", "in_progress", "completed", "cancelled", "expired", "all"] as FilterKey[]).map((f) => {
            const active = filter === f;
            return (
              <button key={f} onClick={() => setFilterAndUrl(f)}
                aria-pressed={active}
                className="px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all border"
                style={{
                  background:  active ? "rgba(255,255,255,0.08)" : "transparent",
                  borderColor: active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
                  color:       active ? "#e4e4e7" : "#52525b",
                }}>
                {f === "all" ? "Todas" : ST[f]?.label ?? f}
              </button>
            );
          })}
        </div>
        {lastSync && (
          <button onClick={() => load()} title="Actualizar"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "transparent", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "0.3rem 0.7rem", color: "#52525b", fontSize: "0.72rem", cursor: "pointer" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#a1a1aa")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#52525b")}>
            <RefreshCw size={11} />
            {formatDistanceToNow(lastSync, { locale: es, addSuffix: true })}
          </button>
        )}
      </div>

      {/* Lista de reservas */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 10 }} />)}
        </div>
      )}
      {!loading && bookings.length === 0 && (
        <div className="aura-card p-10 text-center" style={{ color: "#3f3f46" }}>
          Sin reservas con este filtro.
        </div>
      )}
      {!loading && (
        <div className="space-y-2">
          {bookings.map((b) => {
            const s        = ST[b.status] ?? { label: b.status, color: "#374151", dot: "#6b7280" };
            const isExpired = b.expiresAt && new Date(b.expiresAt) < new Date();
            const isActing  = acting === b.id;
            return (
              <div key={b.id} className="aura-card px-6 py-5 flex flex-col md:flex-row md:items-center gap-5"
                style={{ opacity: isActing ? 0.6 : 1, transition: "opacity 0.2s" }}>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <Link href={`/reserva/${b.id}`}
                      className="font-bold text-white hover:text-[#d4af37] transition-colors truncate text-sm"
                      style={{ textDecoration: "none" }}>
                      {b.eventName}
                    </Link>
                    {/* Badge de estado minimalista */}
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "0.15rem 0.55rem", borderRadius: 999,
                      fontSize: "0.65rem", fontWeight: 700,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#a1a1aa",
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
                      {s.label}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "#52525b" }}>
                    {b.client.fullName} · {b.client.email}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#3f3f46" }}>
                    {format(new Date(b.setupAt), "d MMM yyyy · HH:mm'h'", { locale: es })}
                    {b.expiresAt && b.status === "pending_payment" && (
                      <span className="ml-2 font-semibold" style={{ color: isExpired ? "#dc2626" : "#ca8a04" }}>
                        · Vence {formatDistanceToNow(new Date(b.expiresAt), { locale: es, addSuffix: true })}
                      </span>
                    )}
                  </p>
                </div>

                {/* Monto + acciones */}
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: "#d4af37" }}>${Number(b.depositAmount).toFixed(2)}</p>
                    <p className="admin-label">apartado</p>
                  </div>
                  {b.status === "pending_payment" && (
                    <>
                      <button onClick={() => act(b.id, "confirm")} disabled={isActing}
                        aria-label={`Confirmar pago de ${b.eventName}`}
                        className="text-xs font-semibold px-3 py-1.5 rounded-md transition-colors disabled:opacity-40"
                        style={{ background: "rgba(22,163,74,0.1)", color: "#4ade80", border: "1px solid rgba(22,163,74,0.2)" }}>
                        {isActing ? "…" : "✓ Confirmar"}
                      </button>
                      <button onClick={() => act(b.id, "cancel")} disabled={isActing}
                        aria-label={`Cancelar ${b.eventName}`}
                        className="text-xs font-semibold px-3 py-1.5 rounded-md transition-colors disabled:opacity-40"
                        style={{ background: "transparent", color: "#71717a", border: "1px solid rgba(255,255,255,0.08)" }}>
                        Cancelar
                      </button>
                    </>
                  )}
                  {b.status === "confirmed" && (
                    <button onClick={() => act(b.id, "cancel")} disabled={isActing}
                      aria-label={`Cancelar ${b.eventName}`}
                      className="text-xs font-semibold px-3 py-1.5 rounded-md disabled:opacity-40"
                      style={{ background: "transparent", color: "#71717a", border: "1px solid rgba(255,255,255,0.08)" }}>
                      Cancelar
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
