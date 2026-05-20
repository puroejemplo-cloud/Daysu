"use client";
import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval,
         isSameDay, isSameMonth, addMonths, subMonths, getDay } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

interface BookingItem {
  id: string; eventName: string; eventDate: string;
  status: string; clientName: string;
}

const STATUS_DOT: Record<string, string> = {
  pending_payment: "#ca8a04",
  confirmed:       "#16a34a",
  in_progress:     "#3b82f6",
  completed:       "#52525b",
};
const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Pendiente",
  confirmed:       "Confirmada",
  in_progress:     "En curso",
  completed:       "Completada",
};

const EVENT_TYPE_CFG: Record<string, { color: string; label: string }> = {
  boda:        { color: "#e11d8a", label: "Boda" },
  xv:          { color: "#7c3aed", label: "XV" },
  graduacion:  { color: "#3b82f6", label: "Grad" },
  cumpleanos:  { color: "#f97316", label: "Cumple" },
  corporativo: { color: "#06b6d4", label: "Corp" },
  baby:        { color: "#38bdf8", label: "Baby" },
  infantil:    { color: "#eab308", label: "Inf" },
  otro:        { color: "#71717a", label: "Evt" },
};

// Parsea "2025-05-19T00:00:00.000Z" como fecha local (evita UTC→local offset)
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d);
}

function detectType(eventName: string): string {
  const n = eventName.toLowerCase();
  if (n.includes("boda") || n.includes("matrimonio") || n.includes("wedding")) return "boda";
  if (n.includes("xv") || n.includes("quinceañera") || n.includes("quince año")) return "xv";
  if (n.includes("graduación") || n.includes("graduacion") || n.includes("egresado")) return "graduacion";
  if (n.includes("cumpleaños") || n.includes("cumple") || n.includes("birthday")) return "cumpleanos";
  if (n.includes("corporativo") || n.includes("empresa") || n.includes("congreso")) return "corporativo";
  if (n.includes("baby") || n.includes("bebé") || n.includes("bebe")) return "baby";
  if (n.includes("infantil") || n.includes("niño") || n.includes("nino")) return "infantil";
  return "otro";
}

export default function CalendarView({ bookings }: { bookings: BookingItem[] }) {
  const [current,  setCurrent]  = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(null);

  const start  = startOfMonth(current);
  const end    = endOfMonth(current);
  const days   = eachDayOfInterval({ start, end });
  const offset = (getDay(start) + 6) % 7;

  const bookingsForDay = (day: Date) =>
    bookings.filter((b) => isSameDay(parseLocalDate(b.eventDate), day));

  const selectedBookings = selected ? bookingsForDay(selected) : [];

  return (
    <div className="space-y-5">
      {/* Navegación mes */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrent(subMonths(current, 1))}
          className="px-4 py-1.5 rounded-md text-sm font-semibold border transition-all"
          style={{ borderColor: "rgba(255,255,255,0.08)", color: "#71717a", background: "transparent" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#a1a1aa")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#71717a")}>
          ← Anterior
        </button>
        <h2 className="text-base font-bold tracking-widest" style={{ color: "#e4e4e7" }}>
          {format(current, "MMMM yyyy", { locale: es }).toUpperCase()}
        </h2>
        <button onClick={() => setCurrent(addMonths(current, 1))}
          className="px-4 py-1.5 rounded-md text-sm font-semibold border transition-all"
          style={{ borderColor: "rgba(255,255,255,0.08)", color: "#71717a", background: "transparent" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#a1a1aa")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#71717a")}>
          Siguiente →
        </button>
      </div>

      {/* Leyenda de tipos */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {Object.entries(EVENT_TYPE_CFG).filter(([k]) => k !== "otro").map(([key, cfg]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs" style={{ color: "#71717a" }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: cfg.color, display: "inline-block", flexShrink: 0 }} />
            {cfg.label}
          </span>
        ))}
      </div>

      {/* Cabecera días */}
      <div className="grid grid-cols-7 gap-1">
        {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map((d) => (
          <div key={d} className="text-center text-xs font-semibold py-2 admin-label">{d}</div>
        ))}

        {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} />)}

        {days.map((day) => {
          const dayBookings = bookingsForDay(day);
          const isToday    = isSameDay(day, new Date());
          const isSelected = selected ? isSameDay(day, selected) : false;
          const hasEvents  = dayBookings.length > 0;

          return (
            <div key={day.toISOString()}
              onClick={() => setSelected(isSameDay(day, selected ?? new Date("2000-01-01")) ? null : day)}
              style={{
                minHeight: 72,
                borderRadius: 8,
                padding: "0.4rem",
                cursor: hasEvents ? "pointer" : "default",
                background: isSelected ? "rgba(212,175,55,0.08)"
                           : isToday   ? "rgba(255,255,255,0.04)"
                           : "transparent",
                border: isSelected ? "1px solid rgba(212,175,55,0.3)"
                       : isToday   ? "1px solid rgba(255,255,255,0.1)"
                       : "1px solid rgba(255,255,255,0.04)",
                transition: "all 0.15s",
              }}>
              <p className="text-xs font-semibold mb-1"
                style={{ color: isToday ? "#e4e4e7" : isSameMonth(day, current) ? "#71717a" : "#27272a" }}>
                {format(day, "d")}
              </p>
              {dayBookings.slice(0, 2).map((b) => {
                const type = detectType(b.eventName);
                const cfg  = EVENT_TYPE_CFG[type];
                return (
                  <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 2 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: STATUS_DOT[b.status] ?? "#52525b", flexShrink: 0 }} />
                    <span style={{
                      fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.03em",
                      color: cfg.color,
                      overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                    }}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
              {dayBookings.length > 2 && (
                <p style={{ fontSize: "0.58rem", color: "#52525b" }}>+{dayBookings.length - 2}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Detalle día seleccionado */}
      {selected && (
        <div className="aura-card p-5 space-y-3">
          <p className="admin-label">
            {format(selected, "EEEE d 'de' MMMM yyyy", { locale: es })}
          </p>
          {selectedBookings.length === 0 ? (
            <p className="text-sm" style={{ color: "#52525b" }}>Sin eventos este día.</p>
          ) : (
            selectedBookings.map((b) => {
              const type = detectType(b.eventName);
              const cfg  = EVENT_TYPE_CFG[type];
              return (
                <div key={b.id} className="flex items-center justify-between gap-3 py-3 border-b"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span style={{
                      flexShrink: 0,
                      fontSize: "0.6rem", fontWeight: 800, padding: "2px 6px", borderRadius: 4,
                      background: cfg.color + "22", color: cfg.color,
                      border: `1px solid ${cfg.color}55`,
                    }}>
                      {cfg.label}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "#e4e4e7" }}>{b.eventName}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#52525b" }}>{b.clientName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.65rem", color: "#71717a" }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: STATUS_DOT[b.status] ?? "#52525b" }} />
                      {STATUS_LABEL[b.status] ?? b.status}
                    </span>
                    <Link href={`/admin?booking=${b.id}`}
                      className="text-xs font-semibold" style={{ color: "#a1a1aa", textDecoration: "none" }}>
                      Ver →
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Resumen del mes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Object.entries(STATUS_DOT).map(([s, dot]) => {
          const count = bookings.filter((b) =>
            b.status === s && isSameMonth(parseLocalDate(b.eventDate), current)
          ).length;
          return (
            <div key={s} className="aura-card p-4 text-center">
              <p className="text-xl font-bold" style={{ color: "#e4e4e7" }}>{count}</p>
              <p className="admin-label mt-1 flex items-center justify-center gap-1">
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: dot, display: "inline-block" }} />
                {STATUS_LABEL[s]}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
