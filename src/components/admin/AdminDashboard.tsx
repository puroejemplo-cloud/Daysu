"use client";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  format, formatDistanceToNow, startOfDay, addDays,
  isToday, isTomorrow, isSameDay,
} from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import {
  Package, PlusCircle, Users, CheckSquare, CalendarDays, Eye,
  RefreshCw, CalendarX, Pencil, TrendingUp, Clock, DollarSign,
  CalendarClock, ArrowRight, AlertTriangle, MapPin, ChevronRight,
  Search, X, RotateCcw,
} from "lucide-react";
import NotificationPermission from "@/components/ui/NotificationPermission";
import EditBookingModal from "@/components/admin/EditBookingModal";

interface Booking {
  id: string; eventName: string; status: string;
  eventDate: string; setupAt: string; expiresAt: string | null;
  venueAddress: string | null;
  totalAmount: string; depositAmount: string;
  client: { fullName: string; email: string; phone: string | null };
  notifications: { id: string }[];
}

interface Toast {
  id: number; message: string; type: "success" | "error";
  action?: { label: string; onClick: () => void };
}

const UNDO_MS = 5000;

// Estado → etiqueta + color semántico (el color SOLO significa estado)
const ST: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  pending_payment: { label: "Pendiente pago", color: "#fbbf24", dot: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
  confirmed:       { label: "Confirmada",     color: "#4ade80", dot: "#22c55e", bg: "rgba(34,197,94,0.1)"   },
  expired:         { label: "Vencida",        color: "#f87171", dot: "#ef4444", bg: "rgba(239,68,68,0.1)"   },
  cancelled:       { label: "Cancelada",      color: "#9ca3af", dot: "#6b7280", bg: "rgba(107,114,128,0.08)" },
  in_progress:     { label: "En curso",       color: "#60a5fa", dot: "#3b82f6", bg: "rgba(59,130,246,0.1)"  },
  completed:       { label: "Completada",     color: "#9ca3af", dot: "#6b7280", bg: "rgba(107,114,128,0.08)" },
};

type FilterKey = "all" | "pending_payment" | "confirmed" | "in_progress" | "completed" | "cancelled" | "expired";

// Acciones rápidas — sobrias, un solo estilo (la primaria destaca en gold)
const QUICK_LINKS = [
  { href: "/admin/ventas/nueva", Icon: PlusCircle,   label: "Nueva venta",  primary: true  },
  { href: "/admin/calendario",   Icon: CalendarDays, label: "Calendario",   primary: false },
  { href: "/admin/clientes",     Icon: Users,        label: "Clientes",     primary: false },
  { href: "/admin/productos",    Icon: Package,      label: "Productos",    primary: false },
  { href: "/admin/checklists",   Icon: CheckSquare,  label: "Checklists",   primary: false },
  { href: "/catalogo",           Icon: Eye,          label: "Ver sitio",    primary: false },
];

const AGENDA_STATUSES = ["pending_payment", "confirmed", "in_progress"];

let toastId = 0;

function dayLabel(d: Date): string {
  if (isToday(d)) return "Hoy";
  if (isTomorrow(d)) return "Mañana";
  return format(d, "EEEE d 'de' MMMM", { locale: es });
}

export default function AdminDashboard() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const firstName = (session?.user?.name ?? "").split(" ")[0];

  const initialFilter = (searchParams.get("status") ?? "pending_payment") as FilterKey;
  const [allBookings,   setAllBookings]   = useState<Booking[]>([]);
  const [filter,        setFilter]        = useState<FilterKey>(initialFilter);
  const [loading,       setLoading]       = useState(true);
  const [acting,        setActing]        = useState<string | null>(null);
  const [toasts,        setToasts]        = useState<Toast[]>([]);
  const [lastSync,      setLastSync]      = useState<Date | null>(null);
  const [editId,        setEditId]        = useState<string | null>(null);
  const [extraBookings, setExtraBookings] = useState<Booking[]>([]);
  const [search,        setSearch]        = useState("");
  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelTimers   = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pendingCancel  = useRef<Record<string, string>>({}); // id → estado previo (undo)

  const addToast = useCallback((
    message: string,
    type: Toast["type"] = "success",
    opts?: { action?: Toast["action"]; duration?: number },
  ) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type, action: opts?.action }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), opts?.duration ?? 3500);
    return id;
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const res  = await fetch("/api/admin/bookings");
    const json = await res.json();
    const data: Booking[] = json.data ?? [];
    // Preserva cancelaciones optimistas dentro de la ventana de "Deshacer"
    const ov = pendingCancel.current;
    setAllBookings(
      Object.keys(ov).length
        ? data.map((b) => (ov[b.id] ? { ...b, status: "cancelled" } : b))
        : data,
    );
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
    const timers = cancelTimers.current;
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      Object.values(timers).forEach(clearTimeout);
    };
  }, [load]);

  const setFilterAndUrl = useCallback((f: FilterKey) => {
    setFilter(f);
    const params = new URLSearchParams(searchParams.toString());
    if (f === "pending_payment") params.delete("status");
    else params.set("status", f);
    router.replace(`/admin?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Confirmar pago — acción positiva, inmediata
  const confirmPayment = async (id: string) => {
    setActing(id);
    setAllBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "confirmed" } : b));
    try {
      const res = await fetch(`/api/bookings/${id}/confirm`, { method: "POST" });
      if (!res.ok) throw new Error();
      addToast("Pago confirmado");
      await load(true);
    } catch {
      addToast("Error al procesar. Intenta de nuevo.", "error");
      await load(true);
    } finally {
      setActing(null);
    }
  };

  // Cancelar — destructiva: se aplica optimista y solo llega a la API tras
  // la ventana de "Deshacer". Un clic accidental no cancela una reserva real.
  const finalizeCancel = async (id: string) => {
    delete cancelTimers.current[id];
    delete pendingCancel.current[id];
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, { method: "POST" });
      if (!res.ok) throw new Error();
      await load(true);
    } catch {
      addToast("Error al cancelar. Intenta de nuevo.", "error");
      await load(true);
    }
  };

  const undoCancel = (id: string) => {
    const t = cancelTimers.current[id];
    if (t) { clearTimeout(t); delete cancelTimers.current[id]; }
    const prev = pendingCancel.current[id];
    delete pendingCancel.current[id];
    if (prev) setAllBookings((list) => list.map((x) => x.id === id ? { ...x, status: prev } : x));
  };

  const requestCancel = (b: Booking) => {
    if (cancelTimers.current[b.id]) return; // ya en ventana de deshacer
    pendingCancel.current[b.id] = b.status;
    setAllBookings((list) => list.map((x) => x.id === b.id ? { ...x, status: "cancelled" } : x));
    const tId = addToast(`"${b.eventName}" cancelada`, "error", {
      duration: UNDO_MS,
      action: { label: "Deshacer", onClick: () => { removeToast(tId); undoCancel(b.id); } },
    });
    cancelTimers.current[b.id] = setTimeout(() => finalizeCancel(b.id), UNDO_MS);
  };

  // ── Métricas ── un solo recorrido, memoizado (no recalcular al teclear/buscar)
  const metrics = useMemo(() => {
    const counts: Record<string, number> = { all: allBookings.length };
    let revenue = 0;
    for (const b of allBookings) {
      counts[b.status] = (counts[b.status] ?? 0) + 1;
      if (b.status === "confirmed") revenue += Number(b.depositAmount);
    }
    return {
      counts,
      pending:   counts.pending_payment ?? 0,
      confirmed: counts.confirmed ?? 0,
      revenue,
      total:     allBookings.length || 1,
    };
  }, [allBookings]);
  const { pending, confirmed, revenue, total } = metrics;

  // ── Agenda: próximos eventos agrupados por día ──
  const today0 = useMemo(() => startOfDay(new Date()), []);
  const weekEnd = useMemo(() => addDays(today0, 7), [today0]);

  const agendaGroups = useMemo(() => {
    const items = allBookings
      .filter((b) => AGENDA_STATUSES.includes(b.status))
      .map((b) => ({ b, d: new Date(b.eventDate) }))
      .filter(({ d }) => d >= today0)
      .sort((a, z) => a.d.getTime() - z.d.getTime())
      .slice(0, 20);

    const groups: { key: string; date: Date; items: Booking[] }[] = [];
    for (const { b, d } of items) {
      const last = groups[groups.length - 1];
      if (last && isSameDay(last.date, d)) last.items.push(b);
      else groups.push({ key: b.id, date: d, items: [b] });
    }
    return groups;
  }, [allBookings, today0]);

  const eventsThisWeek = useMemo(
    () => allBookings.filter((b) => {
      if (!AGENDA_STATUSES.includes(b.status)) return false;
      const d = new Date(b.eventDate);
      return d >= today0 && d < weekEnd;
    }).length,
    [allBookings, today0, weekEnd],
  );

  // ── Alertas: holds por vencer (< 24h) o vencidos aún en pending ──
  const expiringHolds = useMemo(() => {
    const soon = addDays(new Date(), 1);
    return allBookings.filter(
      (b) => b.status === "pending_payment" && b.expiresAt && new Date(b.expiresAt) < soon,
    );
  }, [allBookings]);

  const baseList =
    filter === "all"
      ? allBookings
      : filter === "cancelled" || filter === "expired"
      ? extraBookings
      : allBookings.filter((b) => b.status === filter);

  const q = search.trim().toLowerCase();
  const displayedBookings = q
    ? baseList.filter((b) =>
        b.eventName.toLowerCase().includes(q) ||
        b.client.fullName.toLowerCase().includes(q) ||
        (b.client.phone ?? "").toLowerCase().includes(q) ||
        (b.client.email ?? "").toLowerCase().includes(q))
    : baseList;

  const KPIS = [
    { label: "Holds activos", value: pending,        Icon: Clock,        cls: pending > 0 ? "is-warn" : "is-muted", pct: Math.round(pending / total * 100) },
    { label: "Confirmadas",   value: confirmed,      Icon: TrendingUp,   cls: "", pct: Math.round(confirmed / total * 100) },
    { label: "Esta semana",   value: eventsThisWeek, Icon: CalendarClock, cls: eventsThisWeek > 0 ? "is-accent" : "is-muted", pct: null },
    { label: "Apartados MXN", value: revenue,        Icon: DollarSign,   cls: "is-accent sm", pct: null, isMoney: true },
  ];

  return (
    <div className="dash-stack">
      {/* Toasts */}
      <div className="admin-toast-container"
        style={{ position: "fixed", right: "1rem", zIndex: 9999, display: "flex", flexDirection: "column", gap: "0.5rem", pointerEvents: "none" }}
        aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} role="status"
            style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.65rem 0.75rem 0.65rem 1rem", borderRadius: 8, fontSize: "0.82rem", fontWeight: 500,
              background: t.type === "success" ? "#14532d" : "#450a0a",
              border: `1px solid ${t.type === "success" ? "rgba(22,163,74,.3)" : "rgba(220,38,38,.3)"}`,
              color: t.type === "success" ? "#86efac" : "#fca5a5",
              pointerEvents: "auto", boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            }}>
            <span>{t.message}</span>
            {t.action && (
              <button onClick={t.action.onClick}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.3rem", flexShrink: 0,
                  padding: "0.25rem 0.55rem", borderRadius: 6, cursor: "pointer",
                  fontSize: "0.72rem", fontWeight: 700,
                  background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                  color: "#fff",
                }}>
                <RotateCcw size={11} /> {t.action.label}
              </button>
            )}
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

      {/* ── Saludo + fecha ── */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
        <p style={{ fontSize: "0.95rem", fontWeight: 500, color: "#e4e4e7" }}>
          {firstName ? `Hola, ${firstName}` : "Bienvenido"}
        </p>
        <p className="dash-greet-date">{format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}</p>
      </div>

      {/* ── KPIs ── */}
      <div className="dash-kpis">
        {KPIS.map((s) => (
          <div key={s.label} className="dash-kpi">
            <div className="dash-kpi-top">
              <span className="admin-label">{s.label}</span>
              <span className="dash-kpi-icon"><s.Icon size={14} /></span>
            </div>
            <p className={`dash-kpi-value ${s.cls}`}>
              {s.isMoney
                ? `$${(s.value as number).toLocaleString("es-MX", { maximumFractionDigits: 0 })}`
                : s.value}
            </p>
            {s.pct !== null && allBookings.length > 0 && (
              <div>
                <div style={{ height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 1, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${s.pct}%`, background: "var(--gold)", borderRadius: 1, transition: "width 0.6s ease", opacity: 0.55 }} />
                </div>
                <p style={{ fontSize: "0.6rem", color: "#3f3f46", marginTop: "0.25rem" }}>{s.pct}% del total activo</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Dos columnas: Agenda + Aside ── */}
      <div className="dash-cols">
        {/* Columna principal — Agenda */}
        <div className="dash-panel">
          <div className="dash-panel-head">
            <span className="dash-panel-title"><CalendarClock size={13} /> Próximos eventos</span>
            <Link href="/admin/calendario" className="dash-greet-date" style={{ display: "flex", alignItems: "center", gap: "0.25rem", textDecoration: "none" }}>
              Calendario <ChevronRight size={12} />
            </Link>
          </div>

          {loading && (
            <div style={{ padding: "1rem" }}>
              {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8, marginBottom: 8 }} />)}
            </div>
          )}

          {!loading && agendaGroups.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem", padding: "2.75rem 1rem" }}>
              <CalendarX size={22} style={{ color: "#3f3f46" }} />
              <p style={{ fontSize: "0.82rem", color: "#71717a" }}>Sin eventos próximos</p>
              <Link href="/admin/ventas/nueva" className="dash-quick is-primary" style={{ padding: "0.45rem 0.9rem" }}>
                <PlusCircle size={14} /> Registrar venta
              </Link>
            </div>
          )}

          {!loading && agendaGroups.map((g) => (
            <div key={g.key}>
              <div className={`dash-daterow ${isToday(g.date) ? "is-today" : ""}`}>
                {dayLabel(g.date)}
              </div>
              {g.items.map((b) => {
                const s = ST[b.status] ?? ST.completed;
                return (
                  <Link key={b.id} href={`/reserva/${b.id}`} className="dash-agenda-item">
                    <span className="dash-agenda-time">
                      {format(new Date(b.setupAt), "HH:mm", { locale: es })}
                    </span>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, flexShrink: 0, boxShadow: `0 0 6px ${s.dot}80` }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span className="dash-agenda-name" style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {b.eventName}
                      </span>
                      <span className="dash-agenda-meta" style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                        {b.client.fullName}
                        {b.venueAddress && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", color: "#71717a" }}>
                            <MapPin size={10} /> {b.venueAddress.split(",")[0]}
                          </span>
                        )}
                      </span>
                    </span>
                    <span style={{
                      fontSize: "0.6rem", fontWeight: 700, padding: "0.12rem 0.45rem",
                      borderRadius: 99, background: s.bg, border: `1px solid ${s.dot}30`, color: s.color, flexShrink: 0,
                    }}>
                      {s.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Aside — alertas + acciones */}
        <div className="dash-aside">
          {/* Alerta accionable */}
          {expiringHolds.length > 0 && (
            <div className="dash-alert">
              <AlertTriangle size={16} style={{ color: "#fbbf24", flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="dash-alert-title">
                  {expiringHolds.length} {expiringHolds.length === 1 ? "hold por vencer" : "holds por vencer"}
                </p>
                <p className="dash-alert-desc">Confirma el pago antes de que se libere el stock.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginTop: "0.6rem" }}>
                  {expiringHolds.slice(0, 3).map((b) => (
                    <div key={b.id} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ flex: 1, minWidth: 0, fontSize: "0.72rem", color: "#d4d4d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {b.eventName}
                      </span>
                      <button onClick={() => confirmPayment(b.id)} disabled={acting === b.id}
                        aria-label={`Confirmar pago de ${b.eventName}`}
                        style={{
                          padding: "0.3rem 0.7rem", borderRadius: 5, fontSize: "0.72rem", fontWeight: 700,
                          background: "rgba(34,197,94,0.14)", color: "#4ade80",
                          border: "1px solid rgba(34,197,94,0.3)", cursor: "pointer", flexShrink: 0,
                        }}>
                        {acting === b.id ? "…" : "✓"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Acciones rápidas */}
          <div className="dash-panel" style={{ padding: "0.9rem" }}>
            <p className="dash-panel-title" style={{ marginBottom: "0.7rem" }}>Acceso rápido</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {QUICK_LINKS.map((q) => (
                <Link key={q.href} href={q.href} className={`dash-quick ${q.primary ? "is-primary" : ""}`}>
                  <q.Icon size={14} /> {q.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Reservas (tabla con filtros) ── */}
      <div className="dash-panel">
        <div className="dash-panel-head" style={{ flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span className="dash-panel-title">Reservas</span>
            <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }} role="group" aria-label="Filtrar por estado">
              {(["pending_payment", "confirmed", "in_progress", "completed", "cancelled", "expired", "all"] as FilterKey[]).map((f) => {
                const active = filter === f;
                return (
                  <button key={f} onClick={() => setFilterAndUrl(f)}
                    aria-pressed={active}
                    style={{
                      padding: "0.22rem 0.65rem", borderRadius: "0.375rem",
                      fontSize: "0.68rem", fontWeight: active ? 600 : 400,
                      background:  active ? "rgba(232,25,138,0.12)" : "transparent",
                      border:      `1px solid ${active ? "rgba(232,25,138,0.35)" : "rgba(255,255,255,0.06)"}`,
                      color:       active ? "#FF9AD5" : "#8f8f99",
                      cursor:      "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
                    }}>
                    {f === "all" ? "Todas" : ST[f]?.label ?? f}
                    {!["cancelled", "expired"].includes(f) && (metrics.counts[f] ?? 0) > 0 && (
                      <span style={{ marginLeft: "0.35rem", opacity: 0.7, fontVariantNumeric: "tabular-nums" }}>
                        {metrics.counts[f]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            {/* Buscador */}
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Search size={12} style={{ position: "absolute", left: 8, color: "#52525b", pointerEvents: "none" }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar evento o cliente…"
                aria-label="Buscar reservas"
                style={{
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 6, padding: "0.3rem 1.6rem 0.3rem 1.55rem",
                  fontSize: "0.72rem", color: "#e4e4e7", width: search ? 190 : 160,
                  outline: "none", transition: "width 0.15s, box-shadow 0.15s, border-color 0.15s",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(232,25,138,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(232,25,138,0.18)"; e.currentTarget.style.width = "190px"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
              />
              {search && (
                <button onClick={() => setSearch("")} aria-label="Limpiar búsqueda"
                  style={{ position: "absolute", right: 6, display: "flex", background: "transparent", border: "none", color: "#71717a", cursor: "pointer", padding: 0 }}>
                  <X size={12} />
                </button>
              )}
            </div>

            {lastSync && (
              <button onClick={() => load()} title="Actualizar"
                style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "transparent", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "0.28rem 0.65rem", color: "#52525b", fontSize: "0.68rem", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#a1a1aa")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#52525b")}>
                <RefreshCw size={11} />
                {formatDistanceToNow(lastSync, { locale: es, addSuffix: true })}
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", padding: "1rem" }}>
            {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 10 }} />)}
          </div>
        )}

        {!loading && displayedBookings.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 1rem", gap: "0.6rem" }}>
            <CalendarX size={20} style={{ color: "#3f3f46" }} />
            <p style={{ fontSize: "0.82rem", color: "#71717a" }}>{q ? "Sin coincidencias" : "Sin reservas"}</p>
            <p style={{ fontSize: "0.72rem", color: "#3f3f46", textAlign: "center" }}>
              {q
                ? `Ninguna reserva coincide con "${search.trim()}".`
                : filter === "all" ? "No hay reservas registradas." : `No hay reservas con estado "${ST[filter]?.label ?? filter}".`}
            </p>
          </div>
        )}

        {!loading && displayedBookings.map((b) => {
          const s         = ST[b.status] ?? ST.completed;
          const isExpired = b.expiresAt && new Date(b.expiresAt) < new Date();
          const isActing  = acting === b.id;
          return (
            <div key={b.id}
              style={{
                display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap",
                padding: "0.9rem 1.1rem", borderBottom: "1px solid rgba(255,255,255,0.04)",
                opacity: isActing ? 0.6 : 1, transition: "opacity 0.2s, background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.015)"}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.dot, flexShrink: 0, boxShadow: `0 0 6px ${s.dot}80` }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.2rem" }}>
                  <Link href={`/reserva/${b.id}`}
                    style={{ textDecoration: "none", fontSize: "0.85rem", fontWeight: 600, color: "#e4e4e7", lineHeight: 1.3 }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "#FF3DA8"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "#e4e4e7"}>
                    {b.eventName}
                  </Link>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 99, background: s.bg, border: `1px solid ${s.dot}30`, color: s.color }}>
                    {s.label}
                  </span>
                  {b.notifications.length > 0 && (
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: 99, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}>
                      {b.notifications.length} sin leer
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "0.72rem", color: "#a1a1aa" }}>
                  {b.client.fullName}
                  {b.client.phone && <span style={{ color: "#71717a" }}> · {b.client.phone}</span>}
                </p>
                <p style={{ fontSize: "0.68rem", color: "#71717a", marginTop: "0.15rem" }}>
                  {format(new Date(b.setupAt), "d MMM yyyy · HH:mm'h'", { locale: es })}
                  {b.expiresAt && b.status === "pending_payment" && (
                    <span style={{ marginLeft: "0.5rem", fontWeight: 600, color: isExpired ? "#ef4444" : "#f59e0b" }}>
                      · {isExpired ? "Vencido" : `Vence ${formatDistanceToNow(new Date(b.expiresAt), { locale: es, addSuffix: true })}`}
                    </span>
                  )}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0, flexWrap: "wrap" }}>
                <div style={{ textAlign: "right", minWidth: 76 }}>
                  <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "#FF3DA8", lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}>
                    ${Number(b.depositAmount).toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                  </p>
                  <p className="admin-label" style={{ fontSize: "0.55rem" }}>apartado</p>
                </div>
                <button onClick={() => setEditId(b.id)} disabled={isActing}
                  aria-label={`Editar ${b.eventName}`}
                  style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.35rem 0.6rem", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#71717a", fontSize: "0.68rem", cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#e4e4e7"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#71717a"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>
                  <Pencil size={11} /> Editar
                </button>
                {b.status === "pending_payment" && (
                  <>
                    <button onClick={() => confirmPayment(b.id)} disabled={isActing}
                      aria-label={`Confirmar pago de ${b.eventName}`}
                      style={{ padding: "0.35rem 0.7rem", borderRadius: 6, fontSize: "0.68rem", fontWeight: 600, background: "rgba(34,197,94,0.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.25)", cursor: "pointer" }}>
                      {isActing ? "…" : "✓ Confirmar"}
                    </button>
                    <button onClick={() => requestCancel(b)} disabled={isActing}
                      aria-label={`Cancelar ${b.eventName}`}
                      style={{ padding: "0.35rem 0.6rem", borderRadius: 6, fontSize: "0.68rem", background: "transparent", color: "#6b7280", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}>
                      Cancelar
                    </button>
                  </>
                )}
                {b.status === "confirmed" && (
                  <button onClick={() => requestCancel(b)} disabled={isActing}
                    aria-label={`Cancelar ${b.eventName}`}
                    style={{ padding: "0.35rem 0.6rem", borderRadius: 6, fontSize: "0.68rem", background: "transparent", color: "#6b7280", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}>
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
    </div>
  );
}
