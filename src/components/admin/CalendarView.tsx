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

export default function CalendarView({ bookings }: { bookings: BookingItem[] }) {
  const [current,  setCurrent]  = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(null);

  const start = startOfMonth(current);
  const end   = endOfMonth(current);
  const days  = eachDayOfInterval({ start, end });
  const offset = (getDay(start) + 6) % 7;

  const bookingsForDay = (day: Date) =>
    bookings.filter((b) => isSameDay(new Date(b.eventDate), day));

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
                minHeight: 68,
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
              {dayBookings.slice(0, 2).map((b) => (
                <div key={b.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 3,
                    marginBottom: 2,
                  }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: STATUS_DOT[b.status] ?? "#52525b", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.58rem", color: "#71717a", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                    {b.clientName.split(" ")[0]}
                  </span>
                </div>
              ))}
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
            selectedBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-3 py-3 border-b"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#e4e4e7" }}>{b.eventName}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#52525b" }}>{b.clientName}</p>
                </div>
                <div className="flex items-center gap-3">
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
            ))
          )}
        </div>
      )}

      {/* Resumen del mes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Object.entries(STATUS_DOT).map(([s, dot]) => {
          const count = bookings.filter((b) =>
            b.status === s && isSameMonth(new Date(b.eventDate), current)
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
