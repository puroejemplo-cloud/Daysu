"use client";
import { useState, useEffect, useCallback } from "react";
import { format, formatDistanceToNow, isToday, isTomorrow, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { RefreshCw, Pencil, Plus, X } from "lucide-react";
import EditBookingModal from "@/components/admin/EditBookingModal";

interface EventItem { name: string; quantity: number }

interface UpcomingEvent {
  id: string; eventName: string; eventDate: string; setupAt: string;
  status: string; clientName: string; clientPhone: string | null;
  totalAmount: string; depositAmount: string;
  items: EventItem[];
}
interface PendingEvent {
  id: string; eventName: string; eventDate: string; expiresAt: string | null;
  totalAmount: string; depositAmount: string;
  clientName: string; clientPhone: string | null;
}

interface AbonoTarget {
  id: string; eventName: string;
  total: number; currentDeposit: number;
}

const EVENT_TYPE_CFG: Record<string, { color: string; label: string }> = {
  boda:        { color: "#e11d8a", label: "Boda" },
  xv:          { color: "#7c3aed", label: "XV" },
  graduacion:  { color: "#3b82f6", label: "Grad" },
  cumpleanos:  { color: "#f97316", label: "Cumple" },
  corporativo: { color: "#06b6d4", label: "Corp" },
  baby:        { color: "#38bdf8", label: "Baby" },
  infantil:    { color: "#eab308", label: "Inf" },
  otro:        { color: "#52525b", label: "Evt" },
};

function detectType(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("boda") || n.includes("matrimonio"))                               return "boda";
  if (n.includes("xv") || n.includes("quinceañera"))                                return "xv";
  if (n.includes("graduación") || n.includes("graduacion"))                         return "graduacion";
  if (n.includes("cumpleaños") || n.includes("cumple"))                             return "cumpleanos";
  if (n.includes("corporativo") || n.includes("empresa") || n.includes("congreso")) return "corporativo";
  if (n.includes("baby") || n.includes("bebé") || n.includes("bebe"))               return "baby";
  if (n.includes("infantil") || n.includes("niño"))                                 return "infantil";
  return "otro";
}

function parseLocal(iso: string): Date {
  const [y, m, d] = iso.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dayLabel(iso: string): string {
  const date = parseLocal(iso);
  if (isToday(date))    return "Hoy";
  if (isTomorrow(date)) return "Mañana";
  return format(date, "EEE d MMM", { locale: es });
}

function groupUpcoming(events: UpcomingEvent[]) {
  const map = new Map<string, UpcomingEvent[]>();
  for (const e of events) {
    const key = e.eventDate.split("T")[0];
    map.set(key, [...(map.get(key) ?? []), e]);
  }
  return map;
}

interface Props {
  upcoming: UpcomingEvent[];
  pending:  PendingEvent[];
}

export default function AgendaWidget({ upcoming: initUpcoming, pending: initPending }: Props) {
  const [upcoming, setUpcoming] = useState(initUpcoming);
  const [pending,  setPending]  = useState(initPending);
  const [now,      setNow]      = useState(new Date());
  const [loading,  setLoading]  = useState(false);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [abono,    setAbono]    = useState<AbonoTarget | null>(null);
  const [abonoAmt, setAbonoAmt] = useState("");
  const [abonoSaving, setAbonoSaving] = useState(false);
  const [abonoError,  setAbonoError]  = useState("");

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const todayStart = startOfDay(new Date());
      const [upRes, pdRes] = await Promise.all([
        fetch("/api/admin/bookings?status=confirmed"),
        fetch("/api/admin/bookings?status=pending_payment"),
      ]);
      const [upJson, pdJson] = await Promise.all([upRes.json(), pdRes.json()]);

      setUpcoming(
        (upJson.data ?? [])
          .filter((b: { eventDate: string }) => parseLocal(b.eventDate) >= todayStart)
          .map((b: { id: string; eventName: string; eventDate: string; setupAt: string; status: string; totalAmount: string; depositAmount: string; client: { fullName: string; phone: string | null } }) => ({
            id: b.id, eventName: b.eventName, eventDate: b.eventDate,
            setupAt: b.setupAt, status: b.status,
            totalAmount: b.totalAmount, depositAmount: b.depositAmount,
            clientName: b.client.fullName, clientPhone: b.client.phone ?? null,
            items: [], // la API de lista no incluye items — se cargan al editar
          }))
      );
      setPending(
        (pdJson.data ?? []).map((b: { id: string; eventName: string; eventDate: string; expiresAt: string | null; totalAmount: string; depositAmount: string; client: { fullName: string; phone: string | null } }) => ({
          id: b.id, eventName: b.eventName, eventDate: b.eventDate,
          expiresAt: b.expiresAt ?? null,
          totalAmount: b.totalAmount, depositAmount: b.depositAmount,
          clientName: b.client.fullName, clientPhone: b.client.phone ?? null,
        }))
      );
      setNow(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  const openAbono = (id: string, eventName: string, totalAmount: string, depositAmount: string) => {
    setAbono({ id, eventName, total: Number(totalAmount), currentDeposit: Number(depositAmount) });
    setAbonoAmt("");
    setAbonoError("");
  };

  const submitAbono = async () => {
    if (!abono) return;
    const amount = Number(abonoAmt);
    if (!amount || amount <= 0) { setAbonoError("Ingresa un monto válido"); return; }
    setAbonoSaving(true); setAbonoError("");
    const newDeposit = abono.currentDeposit + amount;
    const res = await fetch(`/api/admin/bookings/${abono.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositAmount: newDeposit }),
    });
    if (!res.ok) {
      setAbonoError("Error al guardar. Intenta de nuevo.");
      setAbonoSaving(false);
      return;
    }
    // Actualiza estado local
    setUpcoming((prev) => prev.map((e) => e.id === abono.id ? { ...e, depositAmount: String(newDeposit) } : e));
    setPending((prev) => prev.map((e) => e.id === abono.id ? { ...e, depositAmount: String(newDeposit) } : e));
    setAbono(null);
    setAbonoSaving(false);
  };

  const grouped  = groupUpcoming(upcoming);
  const dateKeys = Array.from(grouped.keys());
  const anyModalOpen = !!editId || !!abono;

  // ── Abono bottom sheet ──────────────────────────────────────────────────────
  const abonoSheet = () => {
    if (!abono) return null;
    const balance = abono.total - abono.currentDeposit;
    const newAmt  = Number(abonoAmt) || 0;
    const newBalance = balance - newAmt;
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 9992, background: "rgba(0,0,0,0.75)" }}
        onClick={(e) => { if (e.target === e.currentTarget) setAbono(null); }}>
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          maxWidth: 480, margin: "0 auto",
          background: "#0d0d1a", borderRadius: "20px 20px 0 0",
          padding: "1.5rem 1.25rem 2.5rem",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}>
          {/* Handle */}
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)", margin: "0 auto 1.25rem" }} />

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div>
              <p style={{ margin: 0, fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#16a34a" }}>
                Agregar abono
              </p>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.9rem", fontWeight: 600, color: "#e4e4e7" }}>
                {abono.eventName}
              </p>
            </div>
            <button onClick={() => setAbono(null)}
              style={{ background: "transparent", border: "none", color: "#52525b", cursor: "pointer", padding: "0.25rem" }}>
              <X size={18} />
            </button>
          </div>

          {/* Resumen financiero */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
            {[
              { label: "Total", value: abono.total, color: "var(--gold)" },
              { label: "Pagado", value: abono.currentDeposit, color: "#16a34a" },
              { label: "Saldo", value: balance, color: "#ca8a04" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "0.6rem 0.5rem", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color }}>${value.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</p>
                <p style={{ margin: 0, fontSize: "0.58rem", color: "#52525b", marginTop: "0.1rem" }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Input abono */}
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#a1a1aa", marginBottom: "0.4rem" }}>
              Monto del abono
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "#52525b", fontSize: "0.9rem", fontWeight: 600 }}>$</span>
              <input
                type="number" min={1} value={abonoAmt}
                onChange={(e) => setAbonoAmt(e.target.value)}
                placeholder="0"
                autoFocus
                style={{ width: "100%", paddingLeft: "1.75rem", boxSizing: "border-box" }}
                className="aura-input"
              />
            </div>
            {newAmt > 0 && (
              <p style={{ margin: "0.4rem 0 0", fontSize: "0.68rem", color: newBalance >= 0 ? "#52525b" : "#ef4444" }}>
                Nuevo saldo: ${newBalance.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                {newBalance < 0 && " ⚠ excede el saldo"}
              </p>
            )}
            {abonoError && <p style={{ margin: "0.4rem 0 0", fontSize: "0.68rem", color: "#ef4444" }}>{abonoError}</p>}
          </div>

          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button onClick={() => setAbono(null)}
              style={{ flex: 1, padding: "0.75rem", borderRadius: 12, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#71717a", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>
              Cancelar
            </button>
            <button onClick={submitAbono} disabled={abonoSaving || !abonoAmt}
              style={{ flex: 2, padding: "0.75rem", borderRadius: 12, background: "var(--gold)", color: "#05051a", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", opacity: (abonoSaving || !abonoAmt) ? 0.5 : 1 }}>
              {abonoSaving ? "Guardando..." : `Registrar $${(Number(abonoAmt) || 0).toLocaleString("es-MX", { maximumFractionDigits: 0 })}`}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Tarjeta de evento próximo ───────────────────────────────────────────────
  const upcomingCard = (ev: UpcomingEvent) => {
    const type    = detectType(ev.eventName);
    const cfg     = EVENT_TYPE_CFG[type];
    const timeStr = format(new Date(ev.setupAt), "HH:mm");
    const total   = Number(ev.totalAmount);
    const deposit = Number(ev.depositAmount);
    const balance = total - deposit;
    const itemsLabel = ev.items.map((i) => i.quantity > 1 ? `${i.name} ×${i.quantity}` : i.name).join(" · ");

    return (
      <div key={ev.id} style={{
        marginBottom: "0.4rem",
        borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderLeft: `3px solid ${cfg.color}`,
        overflow: "hidden",
      }}>
        {/* Fila principal */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.7rem 0.85rem" }}>
          <span style={{ flexShrink: 0, fontSize: "0.55rem", fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: cfg.color + "25", color: cfg.color, letterSpacing: "0.04em" }}>
            {cfg.label}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600, color: "#e4e4e7", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
              {ev.eventName}
            </p>
            <p style={{ margin: 0, fontSize: "0.68rem", color: "#52525b", marginTop: "0.1rem" }}>
              {ev.clientName}{ev.clientPhone && !ev.clientPhone.includes("@aura.local") && ` · ${ev.clientPhone}`}
            </p>
            {itemsLabel && (
              <p style={{ margin: "0.15rem 0 0", fontSize: "0.62rem", color: "#3f3f46", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                {itemsLabel}
              </p>
            )}
          </div>
          <div style={{ flexShrink: 0, textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#a1a1aa", letterSpacing: "-0.02em" }}>{timeStr}<span style={{ fontSize: "0.6rem", marginLeft: 1 }}>h</span></p>
            <p style={{ margin: 0, fontSize: "0.55rem", color: "#3f3f46" }}>llegada</p>
          </div>
        </div>

        {/* Fila finanzas + acciones */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.45rem 0.85rem", borderTop: "1px solid rgba(255,255,255,0.04)", background: "rgba(0,0,0,0.2)" }}>
          {/* Finanzas */}
          <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.65rem" }}>
            {total > 0 && (
              <>
                <span style={{ color: "var(--gold)" }}>${total.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</span>
                {deposit > 0 && <span style={{ color: "#16a34a" }}>+${deposit.toLocaleString("es-MX", { maximumFractionDigits: 0 })} pagado</span>}
                {balance > 0 && <span style={{ color: "#ca8a04" }}>saldo ${balance.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</span>}
              </>
            )}
          </div>
          {/* Acciones */}
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <button
              onClick={() => openAbono(ev.id, ev.eventName, ev.totalAmount, ev.depositAmount)}
              style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.3rem 0.6rem", borderRadius: 7, background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)", color: "#4ade80", fontSize: "0.65rem", fontWeight: 700, cursor: "pointer" }}>
              <Plus size={10} /> Abono
            </button>
            <button
              onClick={() => setEditId(ev.id)}
              style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.3rem 0.6rem", borderRadius: 7, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#71717a", fontSize: "0.65rem", fontWeight: 700, cursor: "pointer" }}>
              <Pencil size={10} /> Editar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Tarjeta de evento pendiente ─────────────────────────────────────────────
  const pendingCard = (ev: PendingEvent) => {
    const type     = detectType(ev.eventName);
    const cfg      = EVENT_TYPE_CFG[type];
    const total    = Number(ev.totalAmount);
    const deposit  = Number(ev.depositAmount);
    const balance  = total - deposit;
    const expired  = ev.expiresAt ? new Date(ev.expiresAt) < now : false;
    const expLabel = ev.expiresAt ? formatDistanceToNow(new Date(ev.expiresAt), { locale: es, addSuffix: true }) : null;
    const evDayLabel = dayLabel(ev.eventDate);

    return (
      <div key={ev.id} style={{
        marginBottom: "0.4rem", borderRadius: 12, overflow: "hidden",
        background: expired ? "rgba(220,38,38,0.06)" : "rgba(202,138,4,0.06)",
        border: `1px solid ${expired ? "rgba(220,38,38,0.2)" : "rgba(202,138,4,0.2)"}`,
        borderLeft: `3px solid ${cfg.color}`,
      }}>
        <div style={{ padding: "0.7rem 0.85rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                <span style={{ fontSize: "0.55rem", fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: cfg.color + "25", color: cfg.color, letterSpacing: "0.04em" }}>{cfg.label}</span>
                <span style={{ fontSize: "0.6rem", color: "#52525b" }}>{evDayLabel}</span>
              </div>
              <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600, color: "#e4e4e7", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{ev.eventName}</p>
              <p style={{ margin: 0, fontSize: "0.68rem", color: "#52525b", marginTop: "0.1rem" }}>
                {ev.clientName}{ev.clientPhone && ` · ${ev.clientPhone}`}
              </p>
              {expLabel && (
                <p style={{ margin: "0.3rem 0 0", fontSize: "0.65rem", fontWeight: 600, color: expired ? "#ef4444" : "#ca8a04" }}>
                  {expired ? "Hold vencido" : `Vence ${expLabel}`}
                </p>
              )}
            </div>
            <div style={{ flexShrink: 0, textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "var(--gold)" }}>${total.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</p>
              {deposit > 0 && <p style={{ margin: 0, fontSize: "0.6rem", color: "#16a34a" }}>+${deposit.toLocaleString("es-MX", { maximumFractionDigits: 0 })} pagado</p>}
              {balance > 0 && deposit > 0 && <p style={{ margin: 0, fontSize: "0.6rem", color: "#ca8a04" }}>saldo ${balance.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</p>}
            </div>
          </div>
        </div>
        {/* Acciones */}
        <div style={{ display: "flex", gap: "0.4rem", padding: "0.45rem 0.85rem", borderTop: "1px solid rgba(255,255,255,0.04)", background: "rgba(0,0,0,0.2)", justifyContent: "flex-end" }}>
          <button
            onClick={() => openAbono(ev.id, ev.eventName, ev.totalAmount, ev.depositAmount)}
            style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.3rem 0.6rem", borderRadius: 7, background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)", color: "#4ade80", fontSize: "0.65rem", fontWeight: 700, cursor: "pointer" }}>
            <Plus size={10} /> Abono
          </button>
          <button
            onClick={() => setEditId(ev.id)}
            style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.3rem 0.6rem", borderRadius: 7, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#71717a", fontSize: "0.65rem", fontWeight: 700, cursor: "pointer" }}>
            <Pencil size={10} /> Editar
          </button>
        </div>
      </div>
    );
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100dvh", background: "#05051a", maxWidth: 480, margin: "0 auto", paddingBottom: "5rem" }}>

      {/* Modales */}
      {editId && (
        <EditBookingModal
          bookingId={editId}
          onClose={() => setEditId(null)}
          onSaved={() => { setEditId(null); refresh(); }}
        />
      )}
      {abonoSheet()}

      {/* Header */}
      <div style={{ padding: "1.25rem 1.25rem 0.75rem", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, zIndex: 10, background: "#05051a" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#52525b", margin: 0 }}>Aura Producciones</p>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 300, letterSpacing: "-0.03em", color: "#e4e4e7", margin: "0.1rem 0 0" }}>Agenda</h1>
          </div>
          <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.2rem" }}>
            <p style={{ fontSize: "1.3rem", fontWeight: 300, color: "#a1a1aa", margin: 0, letterSpacing: "-0.02em" }}>{format(now, "HH:mm")}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <p style={{ fontSize: "0.65rem", color: "#3f3f46", margin: 0 }}>{format(now, "EEE d MMM", { locale: es })}</p>
              <button onClick={refresh} disabled={loading || anyModalOpen}
                style={{ background: "transparent", border: "none", padding: "0.15rem", cursor: "pointer", color: "#3f3f46", display: "flex", alignItems: "center" }}>
                <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 1rem" }}>

        {/* ── PRÓXIMOS ── */}
        <div style={{ marginTop: "1.25rem" }}>
          <p style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", margin: "0 0 0.75rem" }}>
            Próximos · {upcoming.length}
          </p>
          {dateKeys.length === 0 && (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "#3f3f46", fontSize: "0.8rem" }}>Sin eventos próximos</div>
          )}
          {dateKeys.map((key) => {
            const dayEvents = grouped.get(key)!;
            const label = dayLabel(key + "T00:00:00");
            const isHoy = label === "Hoy";
            const isMañana = label === "Mañana";
            return (
              <div key={key} style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                  <span style={{ fontSize: "0.6rem", fontWeight: 800, padding: "0.15rem 0.55rem", borderRadius: 4, background: isHoy ? "var(--gold)" : isMañana ? "rgba(255,255,255,0.08)" : "transparent", color: isHoy ? "#05051a" : "#a1a1aa", border: isHoy ? "none" : "1px solid rgba(255,255,255,0.08)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {label}
                  </span>
                  {isHoy && <span style={{ fontSize: "0.65rem", color: "#52525b" }}>{format(parseLocal(key + "T00:00:00"), "d 'de' MMMM", { locale: es })}</span>}
                </div>
                {dayEvents.map((ev) => upcomingCard(ev))}
              </div>
            );
          })}
        </div>

        {/* ── POR CONFIRMAR ── */}
        {pending.length > 0 && (
          <div style={{ marginTop: "1.5rem" }}>
            <p style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#ca8a04", margin: "0 0 0.75rem" }}>
              Por confirmar · {pending.length}
            </p>
            {pending.map((ev) => pendingCard(ev))}
          </div>
        )}
      </div>

      {/* Footer fijo */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(5,5,26,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "0.75rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 480, margin: "0 auto", zIndex: 5 }}>
        <p style={{ margin: 0, fontSize: "0.65rem", color: "#3f3f46" }}>{upcoming.length} eventos · {pending.length} por confirmar</p>
        <Link href="/admin" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--gold)", textDecoration: "none" }}>Panel completo →</Link>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
