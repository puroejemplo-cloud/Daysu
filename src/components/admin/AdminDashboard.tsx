"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import {
  Package, PlusCircle, Users, CheckSquare, Bell, Images,
  CalendarDays, Eye, RefreshCw, CalendarX, Pencil,
  TrendingUp, Clock, DollarSign, AlertCircle, ArrowRight,
} from "lucide-react";
import NotificationPermission from "@/components/ui/NotificationPermission";
import EditBookingModal from "@/components/admin/EditBookingModal";

interface Booking {
  id: string; eventName: string; status: string;
  setupAt: string; expiresAt: string | null;
  totalAmount: string; depositAmount: string;
  client: { fullName: string; email: string; phone: string | null };
  notifications: { id: string }[];
}

interface Toast { id: number; message: string; type: "success" | "error" }

const ST: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  pending_payment: { label: "Pendiente pago", color: "#fbbf24", dot: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
  confirmed:       { label: "Confirmada",     color: "#4ade80", dot: "#22c55e", bg: "rgba(34,197,94,0.1)"   },
  expired:         { label: "Vencida",        color: "#f87171", dot: "#ef4444", bg: "rgba(239,68,68,0.1)"   },
  cancelled:       { label: "Cancelada",      color: "#6b7280", dot: "#6b7280", bg: "rgba(107,114,128,0.08)" },
  in_progress:     { label: "En curso",       color: "#60a5fa", dot: "#3b82f6", bg: "rgba(59,130,246,0.1)"  },
  completed:       { label: "Completada",     color: "#6b7280", dot: "#6b7280", bg: "rgba(107,114,128,0.08)" },
};

type FilterKey = "all" | "pending_payment" | "confirmed" | "in_progress" | "completed" | "cancelled" | "expired";

const QUICK_LINKS = [
  { href: "/admin/productos",     Icon: Package,      label: "Productos",    color: "#f97316", bg: "rgba(249,115,22,0.12)"  },
  { href: "/admin/ventas/nueva",  Icon: PlusCircle,   label: "Nueva venta",  color: "#4ade80", bg: "rgba(74,222,128,0.12)"  },
  { href: "/admin/clientes",      Icon: Users,        label: "Clientes",     color: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
  { href: "/admin/checklists",    Icon: CheckSquare,  label: "Checklists",   color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  { href: "/admin/recordatorios", Icon: Bell,         label: "Recordatorios",color: "#fb923c", bg: "rgba(251,146,60,0.12)"  },
  { href: "/admin/galeria",       Icon: Images,       label: "Galería",      color: "#f472b6", bg: "rgba(244,114,182,0.12)" },
  { href: "/admin/calendario",    Icon: CalendarDays, label: "Calendario",   color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
  { href: "/catalogo",            Icon: Eye,          label: "Ver catálogo", color: "#94a3b8", bg: "rgba(148,163,184,0.1)"  },
];

let toastId = 0;

export default function AdminDashboard() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const initialFilter = (searchParams.get("status") ?? "pending_payment") as FilterKey;
  const [allBookings,   setAllBookings]   = useState<Booking[]>([]);
  const [filter,        setFilter]        = useState<FilterKey>(initialFilter);
  const [loading,       setLoading]       = useState(true);
  const [acting,        setActing]        = useState<string | null>(null);
  const [toasts,        setToasts]        = useState<Toast[]>([]);
  const [lastSync,      setLastSync]      = useState<Date | null>(null);
  const [editId,        setEditId]        = useState<string | null>(null);
  const [extraBookings, setExtraBookings] = useState<Booking[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const res  = await fetch("/api/admin/bookings");
    const json = await res.json();
    setAllBookings(json.data ?? []);
    setLastSync(new Date());
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    if (filter === "cancelled" || filter === "expired") {
      fetch(`/api/admin/bookings?status=${filter}`)
        .then((r) => r.json())
        .then((j) => setExtraBookings(j.data ?? []));
    } else {
      setExtraBookings([]);
    }
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
    setAllBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: action === "confirm" ? "confirmed" : "cancelled" } : b));
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

  const pending   = allBookings.filter((b) => b.status === "pending_payment").length;
  const confirmed = allBookings.filter((b) => b.status === "confirmed").length;
  const unread    = allBookings.reduce((n, b) => n + b.notifications.length, 0);
  const revenue   = allBookings
    .filter((b) => b.status === "confirmed")
    .reduce((sum, b) => sum + Number(b.depositAmount), 0);
  const total     = allBookings.length || 1;

  const displayedBookings =
    filter === "all"
      ? allBookings
      : filter === "cancelled" || filter === "expired"
      ? extraBookings
      : allBookings.filter((b) => b.status === filter);

  return (
    <div className="space-y-6">
      {/* Toasts */}
      <div className="admin-toast-container"
        style={{ position: "fixed", right: "1rem", zIndex: 9999, display: "flex", flexDirection: "column", gap: "0.5rem", pointerEvents: "none" }}
        aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} role="status"
            style={{
              padding: "0.65rem 1rem", borderRadius: 8, fontSize: "0.82rem", fontWeight: 500,
              background: t.type === "success" ? "#14532d" : "#450a0a",
              border: `1px solid ${t.type === "success" ? "rgba(22,163,74,.3)" : "rgba(220,38,38,.3)"}`,
              color: t.type === "success" ? "#86efac" : "#fca5a5",
              pointerEvents: "auto", boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            }}>
            {t.message}
          </div>
        ))}
      </div>

      <NotificationPermission />

      {editId && (
        <EditBookingModal
          bookingId={editId}
          onClose={() => setEditId(null)}
          onSaved={() => { load(true); addToast("Reserva actualizada"); }}
        />
      )}

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}
        className="md:grid-cols-4">
        {[
          { label: "Holds activos",  value: pending,   Icon: Clock,        accent: "#f59e0b", pct: Math.round(pending   / total * 100) },
          { label: "Confirmadas",    value: confirmed, Icon: TrendingUp,   accent: "#22c55e", pct: Math.round(confirmed / total * 100) },
          { label: "Sin leer",       value: unread,    Icon: AlertCircle,  accent: "#f43f5e", pct: null },
          { label: "Apartados MXN",  value: revenue,   Icon: DollarSign,   accent: "#a78bfa", pct: null, isMoney: true },
        ].map((s) => (
          <div key={s.label}
            style={{
              background: "#0c0c0f",
              border: "1px solid rgba(255,255,255,0.06)",
              borderTop: `2px solid ${s.accent}`,
              borderRadius: "0.75rem",
              padding: "1.25rem 1.25rem 1rem",
              display: "flex", flexDirection: "column", gap: "0.75rem",
            }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#52525b", marginBottom: "0.5rem" }}>
                  {s.label}
                </p>
                <p style={{
                  fontSize: s.isMoney ? "1.4rem" : "2rem",
                  fontWeight: 200, letterSpacing: "-0.04em",
                  color: s.accent, lineHeight: 1,
                }}>
                  {s.isMoney
                    ? `$${(s.value as number).toLocaleString("es-MX", { maximumFractionDigits: 0 })}`
                    : s.value}
                </p>
              </div>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: `${s.accent}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <s.Icon size={15} style={{ color: s.accent } as React.CSSProperties} />
              </div>
            </div>
            {s.pct !== null && allBookings.length > 0 && (
              <div>
                <div style={{ height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 1, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${s.pct}%`, background: s.accent, borderRadius: 1, transition: "width 0.6s ease", opacity: 0.6 }} />
                </div>
                <p style={{ fontSize: "0.6rem", color: "#3f3f46", marginTop: "0.25rem" }}>{s.pct}% del total activo</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Accesos rápidos ── */}
      <div style={{
        background: "#0c0c0f", border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: "0.75rem", padding: "1rem 1rem 0.75rem",
      }}>
        <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#3f3f46", marginBottom: "0.75rem" }}>
          Acceso rápido
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.4rem" }}
          className="sm:grid-cols-8">
          {QUICK_LINKS.map((item) => (
            <Link key={item.href} href={item.href}
              style={{
                textDecoration: "none", display: "flex", flexDirection: "column",
                alignItems: "center", gap: "0.4rem", padding: "0.75rem 0.5rem",
                borderRadius: "0.5rem",
                background: "transparent",
                border: "1px solid transparent",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = item.bg;
                (e.currentTarget as HTMLElement).style.borderColor = `${item.color}30`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.borderColor = "transparent";
              }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: item.bg,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <item.Icon size={15} style={{ color: item.color } as React.CSSProperties} />
              </div>
              <span style={{ fontSize: "0.6rem", fontWeight: 500, color: "#71717a", lineHeight: 1.3, textAlign: "center", whiteSpace: "nowrap" }}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Reservas ── */}
      <div>
        {/* Header reservas */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem", flexWrap: "wrap", gap: "0.6rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#52525b" }}>
              Reservas
            </p>
            {/* Filtros */}
            <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }} role="group" aria-label="Filtrar por estado">
              {(["pending_payment", "confirmed", "in_progress", "completed", "cancelled", "expired", "all"] as FilterKey[]).map((f) => {
                const active = filter === f;
                const s = ST[f];
                return (
                  <button key={f} onClick={() => setFilterAndUrl(f)}
                    aria-pressed={active}
                    style={{
                      padding: "0.25rem 0.7rem", borderRadius: "0.375rem",
                      fontSize: "0.68rem", fontWeight: active ? 600 : 400,
                      background:  active ? (s ? s.bg : "rgba(255,255,255,0.08)") : "transparent",
                      border:      `1px solid ${active ? (s ? `${s.dot}40` : "rgba(255,255,255,0.14)") : "rgba(255,255,255,0.06)"}`,
                      color:       active ? (s ? s.color : "#e4e4e7") : "#52525b",
                      cursor:      "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
                    }}>
                    {f === "all" ? "Todas" : ST[f]?.label ?? f}
                  </button>
                );
              })}
            </div>
          </div>

          {lastSync && (
            <button onClick={() => load()} title="Actualizar"
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "transparent", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "0.3rem 0.7rem", color: "#52525b", fontSize: "0.68rem", cursor: "pointer", transition: "color 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#a1a1aa")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#52525b")}>
              <RefreshCw size={11} />
              {formatDistanceToNow(lastSync, { locale: es, addSuffix: true })}
            </button>
          )}
        </div>

        {/* Lista */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 76, borderRadius: 10 }} />)}
          </div>
        )}

        {!loading && displayedBookings.length === 0 && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "3.5rem 1rem", gap: "0.75rem",
            background: "#0c0c0f", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "0.75rem",
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CalendarX size={20} style={{ color: "#3f3f46" } as React.CSSProperties} />
            </div>
            <p style={{ fontSize: "0.88rem", fontWeight: 500, color: "#71717a" }}>Sin reservas</p>
            <p style={{ fontSize: "0.78rem", color: "#3f3f46", textAlign: "center" }}>
              {filter === "all" ? "No hay reservas registradas." : `No hay reservas con estado "${ST[filter]?.label ?? filter}".`}
            </p>
          </div>
        )}

        {!loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {displayedBookings.map((b) => {
              const s         = ST[b.status] ?? { label: b.status, color: "#6b7280", dot: "#6b7280", bg: "rgba(107,114,128,0.08)" };
              const isExpired = b.expiresAt && new Date(b.expiresAt) < new Date();
              const isActing  = acting === b.id;
              return (
                <div key={b.id}
                  style={{
                    background: "#0c0c0f", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "0.65rem", padding: "1rem 1.25rem",
                    display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap",
                    opacity: isActing ? 0.6 : 1, transition: "opacity 0.2s, border-color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"}>

                  {/* Status dot */}
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.dot, flexShrink: 0, boxShadow: `0 0 6px ${s.dot}80` }} />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.2rem" }}>
                      <Link href={`/reserva/${b.id}`}
                        style={{ textDecoration: "none", fontSize: "0.85rem", fontWeight: 600, color: "#e4e4e7", lineHeight: 1.3 }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "#FF3DA8"}
                        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "#e4e4e7"}>
                        {b.eventName}
                      </Link>
                      <span style={{
                        fontSize: "0.62rem", fontWeight: 700, padding: "0.15rem 0.5rem",
                        borderRadius: 99, background: s.bg,
                        border: `1px solid ${s.dot}30`, color: s.color,
                      }}>
                        {s.label}
                      </span>
                      {b.notifications.length > 0 && (
                        <span style={{
                          fontSize: "0.6rem", fontWeight: 700, padding: "0.1rem 0.4rem",
                          borderRadius: 99, background: "rgba(239,68,68,0.12)",
                          border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5",
                        }}>
                          {b.notifications.length} sin leer
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "0.72rem", color: "#52525b", lineHeight: 1.4 }}>
                      {b.client.fullName}
                      {b.client.phone && <span style={{ color: "#3f3f46" }}> · {b.client.phone}</span>}
                    </p>
                    <p style={{ fontSize: "0.68rem", color: "#3f3f46", marginTop: "0.15rem" }}>
                      {format(new Date(b.setupAt), "d MMM yyyy · HH:mm'h'", { locale: es })}
                      {b.expiresAt && b.status === "pending_payment" && (
                        <span style={{ marginLeft: "0.5rem", fontWeight: 600, color: isExpired ? "#ef4444" : "#f59e0b" }}>
                          · {isExpired ? "Vencido" : `Vence ${formatDistanceToNow(new Date(b.expiresAt), { locale: es, addSuffix: true })}`}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Monto + acciones */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0, flexWrap: "wrap" }}>
                    <div style={{ textAlign: "right", minWidth: 80 }}>
                      <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "#a78bfa", lineHeight: 1.2 }}>
                        ${Number(b.depositAmount).toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                      </p>
                      <p style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3f3f46" }}>
                        apartado
                      </p>
                    </div>

                    <button onClick={() => setEditId(b.id)} disabled={isActing}
                      aria-label={`Editar ${b.eventName}`}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.3rem",
                        padding: "0.35rem 0.65rem", borderRadius: 6,
                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                        color: "#71717a", fontSize: "0.68rem", cursor: "pointer", transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#e4e4e7"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#71717a"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>
                      <Pencil size={11} />
                      Editar
                    </button>

                    {b.status === "pending_payment" && (
                      <>
                        <button onClick={() => act(b.id, "confirm")} disabled={isActing}
                          aria-label={`Confirmar pago de ${b.eventName}`}
                          style={{
                            padding: "0.35rem 0.75rem", borderRadius: 6, fontSize: "0.68rem", fontWeight: 600,
                            background: "rgba(34,197,94,0.12)", color: "#4ade80",
                            border: "1px solid rgba(34,197,94,0.25)", cursor: "pointer", transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(34,197,94,0.2)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(34,197,94,0.12)")}>
                          {isActing ? "…" : "✓ Confirmar"}
                        </button>
                        <button onClick={() => act(b.id, "cancel")} disabled={isActing}
                          aria-label={`Cancelar ${b.eventName}`}
                          style={{
                            padding: "0.35rem 0.65rem", borderRadius: 6, fontSize: "0.68rem",
                            background: "transparent", color: "#6b7280", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer",
                          }}>
                          Cancelar
                        </button>
                      </>
                    )}
                    {b.status === "confirmed" && (
                      <button onClick={() => act(b.id, "cancel")} disabled={isActing}
                        aria-label={`Cancelar ${b.eventName}`}
                        style={{
                          padding: "0.35rem 0.65rem", borderRadius: 6, fontSize: "0.68rem",
                          background: "transparent", color: "#6b7280", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer",
                        }}>
                        Cancelar
                      </button>
                    )}

                    <Link href={`/reserva/${b.id}`}
                      style={{ display: "flex", alignItems: "center", color: "#3f3f46", transition: "color 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "#a1a1aa"}
                      onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "#3f3f46"}>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
