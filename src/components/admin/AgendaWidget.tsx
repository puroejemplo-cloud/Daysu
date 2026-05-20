"use client";
import { useState, useEffect, useCallback } from "react";
import { format, formatDistanceToNow, isToday, isTomorrow, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { RefreshCw } from "lucide-react";

interface UpcomingEvent {
  id: string; eventName: string; eventDate: string; setupAt: string;
  status: string; clientName: string; clientPhone: string | null;
}
interface PendingEvent {
  id: string; eventName: string; eventDate: string; expiresAt: string | null;
  totalAmount: string; depositAmount: string;
  clientName: string; clientPhone: string | null;
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
  if (n.includes("boda") || n.includes("matrimonio"))                        return "boda";
  if (n.includes("xv") || n.includes("quinceañera"))                         return "xv";
  if (n.includes("graduación") || n.includes("graduacion"))                  return "graduacion";
  if (n.includes("cumpleaños") || n.includes("cumple"))                      return "cumpleanos";
  if (n.includes("corporativo") || n.includes("empresa") || n.includes("congreso")) return "corporativo";
  if (n.includes("baby") || n.includes("bebé") || n.includes("bebe"))        return "baby";
  if (n.includes("infantil") || n.includes("niño"))                          return "infantil";
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

// Agrupa upcoming por día
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

  // Reloj en vivo
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [upRes, pdRes] = await Promise.all([
        fetch("/api/admin/bookings?status=confirmed"),
        fetch("/api/admin/bookings?status=pending_payment"),
      ]);
      const [upJson, pdJson] = await Promise.all([upRes.json(), pdRes.json()]);

      const todayStart = startOfDay(new Date());

      const upData: UpcomingEvent[] = (upJson.data ?? [])
        .filter((b: { eventDate: string }) => parseLocal(b.eventDate) >= todayStart)
        .map((b: { id: string; eventName: string; eventDate: string; setupAt: string; status: string; client: { fullName: string; phone: string | null } }) => ({
          id: b.id, eventName: b.eventName, eventDate: b.eventDate,
          setupAt: b.setupAt, status: b.status,
          clientName: b.client.fullName, clientPhone: b.client.phone ?? null,
        }));

      const pdData: PendingEvent[] = (pdJson.data ?? []).map((b: { id: string; eventName: string; eventDate: string; expiresAt: string | null; totalAmount: string; depositAmount: string; client: { fullName: string; phone: string | null } }) => ({
        id: b.id, eventName: b.eventName, eventDate: b.eventDate,
        expiresAt: b.expiresAt ?? null,
        totalAmount: b.totalAmount, depositAmount: b.depositAmount,
        clientName: b.client.fullName, clientPhone: b.client.phone ?? null,
      }));

      setUpcoming(upData);
      setPending(pdData);
      setNow(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  const grouped = groupUpcoming(upcoming);
  const dateKeys = Array.from(grouped.keys());

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#05051a",
      maxWidth: 480,
      margin: "0 auto",
      paddingBottom: "5rem",
      fontFamily: "inherit",
    }}>

      {/* Header */}
      <div style={{
        padding: "1.25rem 1.25rem 0.75rem",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "sticky", top: 0, zIndex: 10,
        background: "#05051a",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#52525b", margin: 0 }}>
              Aura Producciones
            </p>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 300, letterSpacing: "-0.03em", color: "#e4e4e7", margin: "0.1rem 0 0" }}>
              Agenda
            </h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "1.3rem", fontWeight: 300, color: "#a1a1aa", margin: 0, letterSpacing: "-0.02em" }}>
              {format(now, "HH:mm")}
            </p>
            <p style={{ fontSize: "0.65rem", color: "#3f3f46", margin: 0 }}>
              {format(now, "EEE d MMM", { locale: es })}
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 1rem" }}>

        {/* ── PRÓXIMOS EVENTOS ── */}
        <div style={{ marginTop: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <p style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", margin: 0 }}>
              Próximos · {upcoming.length}
            </p>
            <button onClick={refresh} disabled={loading}
              style={{ background: "transparent", border: "none", padding: "0.25rem", cursor: "pointer", color: "#3f3f46", display: "flex", alignItems: "center" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#71717a")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#3f3f46")}>
              <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            </button>
          </div>

          {dateKeys.length === 0 && (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "#3f3f46", fontSize: "0.8rem" }}>
              Sin eventos próximos
            </div>
          )}

          {dateKeys.map((key) => {
            const dayEvents = grouped.get(key)!;
            const label     = dayLabel(key + "T00:00:00");
            const isHoy     = label === "Hoy";
            const isMañana  = label === "Mañana";

            return (
              <div key={key} style={{ marginBottom: "1rem" }}>
                {/* Cabecera día */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                  <span style={{
                    fontSize: "0.6rem", fontWeight: 800, padding: "0.15rem 0.55rem", borderRadius: 4,
                    background: isHoy ? "var(--gold)" : isMañana ? "rgba(255,255,255,0.08)" : "transparent",
                    color: isHoy ? "#05051a" : "#a1a1aa",
                    border: isHoy ? "none" : "1px solid rgba(255,255,255,0.08)",
                    letterSpacing: "0.06em", textTransform: "uppercase",
                  }}>
                    {label}
                  </span>
                  {isHoy && (
                    <span style={{ fontSize: "0.65rem", color: "#52525b" }}>
                      {format(parseLocal(key + "T00:00:00"), "d 'de' MMMM", { locale: es })}
                    </span>
                  )}
                </div>

                {/* Eventos del día */}
                {dayEvents.map((ev) => {
                  const type     = detectType(ev.eventName);
                  const cfg      = EVENT_TYPE_CFG[type];
                  const timeStr  = format(new Date(ev.setupAt), "HH:mm");

                  return (
                    <Link key={ev.id} href={`/reserva/${ev.id}`} style={{ textDecoration: "none", display: "block" }}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: "0.75rem",
                        padding: "0.7rem 0.85rem", marginBottom: "0.35rem",
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderLeft: `3px solid ${cfg.color}`,
                        transition: "background 0.1s",
                      }}>
                        {/* Badge tipo */}
                        <span style={{
                          flexShrink: 0, fontSize: "0.55rem", fontWeight: 800,
                          padding: "2px 6px", borderRadius: 4,
                          background: cfg.color + "25", color: cfg.color,
                          letterSpacing: "0.04em",
                        }}>
                          {cfg.label}
                        </span>

                        {/* Nombre + cliente */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600, color: "#e4e4e7",
                            overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                            {ev.eventName}
                          </p>
                          <p style={{ margin: 0, fontSize: "0.68rem", color: "#52525b", marginTop: "0.1rem" }}>
                            {ev.clientName}
                            {ev.clientPhone && !ev.clientPhone.startsWith("sin") && ` · ${ev.clientPhone}`}
                          </p>
                        </div>

                        {/* Hora */}
                        <div style={{ flexShrink: 0, textAlign: "right" }}>
                          <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#a1a1aa", letterSpacing: "-0.02em" }}>
                            {timeStr}
                          </p>
                          <p style={{ margin: 0, fontSize: "0.55rem", color: "#3f3f46" }}>llegada</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
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

            {pending.map((ev) => {
              const type     = detectType(ev.eventName);
              const cfg      = EVENT_TYPE_CFG[type];
              const total    = Number(ev.totalAmount);
              const deposit  = Number(ev.depositAmount);
              const balance  = total - deposit;
              const expired  = ev.expiresAt ? new Date(ev.expiresAt) < now : false;
              const expLabel = ev.expiresAt
                ? formatDistanceToNow(new Date(ev.expiresAt), { locale: es, addSuffix: true })
                : null;
              const evDateLabel = dayLabel(ev.eventDate);

              return (
                <Link key={ev.id} href={`/reserva/${ev.id}`} style={{ textDecoration: "none", display: "block" }}>
                  <div style={{
                    padding: "0.75rem 0.9rem", marginBottom: "0.4rem",
                    borderRadius: 12,
                    background: expired ? "rgba(220,38,38,0.06)" : "rgba(202,138,4,0.06)",
                    border: `1px solid ${expired ? "rgba(220,38,38,0.2)" : "rgba(202,138,4,0.2)"}`,
                    borderLeft: `3px solid ${cfg.color}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                          <span style={{ fontSize: "0.55rem", fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: cfg.color + "25", color: cfg.color, letterSpacing: "0.04em" }}>
                            {cfg.label}
                          </span>
                          <span style={{ fontSize: "0.6rem", color: "#52525b" }}>{evDateLabel}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600, color: "#e4e4e7",
                          overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                          {ev.eventName}
                        </p>
                        <p style={{ margin: 0, fontSize: "0.68rem", color: "#52525b", marginTop: "0.1rem" }}>
                          {ev.clientName}
                          {ev.clientPhone && ` · ${ev.clientPhone}`}
                        </p>
                      </div>

                      <div style={{ flexShrink: 0, textAlign: "right" }}>
                        <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: "var(--gold)" }}>
                          ${total.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                        </p>
                        {deposit > 0 && (
                          <p style={{ margin: 0, fontSize: "0.6rem", color: "#16a34a" }}>
                            anticipo ${deposit.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                          </p>
                        )}
                        {balance > 0 && deposit > 0 && (
                          <p style={{ margin: 0, fontSize: "0.6rem", color: "#ca8a04" }}>
                            saldo ${balance.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                          </p>
                        )}
                      </div>
                    </div>

                    {expLabel && (
                      <p style={{ margin: "0.4rem 0 0", fontSize: "0.65rem", fontWeight: 600,
                        color: expired ? "#ef4444" : "#ca8a04" }}>
                        {expired ? "Vencido" : `Vence ${expLabel}`}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer fijo */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(5,5,26,0.95)", backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "0.75rem 1.25rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        maxWidth: 480, margin: "0 auto",
      }}>
        <p style={{ margin: 0, fontSize: "0.65rem", color: "#3f3f46" }}>
          {upcoming.length} eventos · {pending.length} por confirmar
        </p>
        <Link href="/admin"
          style={{
            fontSize: "0.75rem", fontWeight: 700, color: "var(--gold)",
            textDecoration: "none", display: "flex", alignItems: "center", gap: "0.3rem",
          }}>
          Panel completo →
        </Link>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
