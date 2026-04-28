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

const STATUS_COLOR: Record<string, string> = {
  pending_payment: "#f59e0b",
  confirmed:       "#22c55e",
  in_progress:     "#9333ea",
  completed:       "#475569",
};
const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Pendiente",
  confirmed:       "Confirmada",
  in_progress:     "En curso",
  completed:       "Completada",
};

export default function CalendarView({ bookings }: { bookings: BookingItem[] }) {
  const [current, setCurrent] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(null);

  const start = startOfMonth(current);
  const end   = endOfMonth(current);
  const days  = eachDayOfInterval({ start, end });
  const offset = (getDay(start) + 6) % 7; // Lunes primero

  const bookingsForDay = (day: Date) =>
    bookings.filter((b) => isSameDay(new Date(b.eventDate), day));

  const selectedBookings = selected ? bookingsForDay(selected) : [];

  return (
    <div className="space-y-6">
      {/* Navegación mes */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrent(subMonths(current, 1))}
          className="px-4 py-2 rounded-xl text-sm font-bold border transition-all"
          style={{ borderColor: "rgba(201,168,76,.3)", color: "var(--gold)" }}>
          ← Anterior
        </button>
        <h2 className="bebas text-white text-2xl tracking-widest">
          {format(current, "MMMM yyyy", { locale: es }).toUpperCase()}
        </h2>
        <button onClick={() => setCurrent(addMonths(current, 1))}
          className="px-4 py-2 rounded-xl text-sm font-bold border transition-all"
          style={{ borderColor: "rgba(201,168,76,.3)", color: "var(--gold)" }}>
          Siguiente →
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1">
        {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map((d) => (
          <div key={d} className="text-center text-xs font-black uppercase tracking-widest py-2"
            style={{ color: "#475569" }}>{d}</div>
        ))}

        {/* Espacios vacíos antes del primer día */}
        {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} />)}

        {/* Días del mes */}
        {days.map((day) => {
          const dayBookings = bookingsForDay(day);
          const isToday     = isSameDay(day, new Date());
          const isSelected  = selected ? isSameDay(day, selected) : false;
          const hasEvents   = dayBookings.length > 0;

          return (
            <div key={day.toISOString()}
              onClick={() => setSelected(isSameDay(day, selected ?? new Date("2000-01-01")) ? null : day)}
              style={{
                minHeight: 72,
                borderRadius: 10,
                padding: "0.5rem",
                cursor: hasEvents ? "pointer" : "default",
                background: isSelected ? "rgba(201,168,76,.15)"
                           : isToday   ? "rgba(124,58,237,.12)"
                           : "rgba(255,255,255,.02)",
                border: isSelected ? "1px solid rgba(201,168,76,.5)"
                       : isToday   ? "1px solid rgba(124,58,237,.3)"
                       : "1px solid rgba(255,255,255,.04)",
                transition: "all 0.15s",
              }}>
              <p className="text-xs font-black mb-1"
                style={{ color: isToday ? "#c084fc" : isSameMonth(day, current) ? "#94a3b8" : "#2d3748" }}>
                {format(day, "d")}
              </p>
              {dayBookings.slice(0, 2).map((b) => (
                <div key={b.id}
                  style={{
                    background: STATUS_COLOR[b.status] ?? "#7C3AED",
                    borderRadius: 4, padding: "1px 5px",
                    fontSize: "0.62rem", fontWeight: 700, color: "#000",
                    marginBottom: 2, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                  }}>
                  {b.clientName.split(" ")[0]}
                </div>
              ))}
              {dayBookings.length > 2 && (
                <p style={{ fontSize: "0.6rem", color: "#94a3b8", marginTop: 2 }}>+{dayBookings.length - 2} más</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Detalle del día seleccionado */}
      {selected && (
        <div className="aura-card p-5 space-y-3">
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--gold)" }}>
            📅 {format(selected, "EEEE d 'de' MMMM yyyy", { locale: es })}
          </p>
          {selectedBookings.length === 0 ? (
            <p className="text-sm" style={{ color: "#475569" }}>Sin eventos este día.</p>
          ) : (
            selectedBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-3 py-3 border-b"
                style={{ borderColor: "rgba(255,255,255,.06)" }}>
                <div>
                  <p className="font-bold text-white">{b.eventName}</p>
                  <p className="text-sm" style={{ color: "#94a3b8" }}>{b.clientName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: `${STATUS_COLOR[b.status]}22`, color: STATUS_COLOR[b.status] }}>
                    {STATUS_LABEL[b.status] ?? b.status}
                  </span>
                  <Link href={`/admin?booking=${b.id}`}
                    className="text-xs font-bold" style={{ color: "var(--gold)" }}>
                    Ver →
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Resumen del mes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(STATUS_COLOR).map(([s, color]) => {
          const count = bookings.filter((b) =>
            b.status === s && isSameMonth(new Date(b.eventDate), current)
          ).length;
          return (
            <div key={s} className="aura-card p-4 text-center">
              <p className="text-2xl font-black" style={{ color }}>{count}</p>
              <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: "#475569" }}>
                {STATUS_LABEL[s]}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
