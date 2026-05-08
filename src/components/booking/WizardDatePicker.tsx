"use client";
import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, ChevronDown } from "lucide-react";
import "react-day-picker/style.css";

interface Props {
  value: string;          // "YYYY-MM-DD"
  onChange: (v: string) => void;
  minDate?: Date;
}

export default function WizardDatePicker({ value, onChange, minDate }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const today = minDate ?? new Date();
  today.setHours(0, 0, 0, 0);

  // "YYYY-MM-DD" → Date object (noon, evita desfase de zona)
  const selected = value ? new Date(value + "T12:00:00") : undefined;
  const label = selected
    ? format(selected, "EEEE d 'de' MMMM yyyy", { locale: es })
    : null;

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    onChange(format(date, "yyyy-MM-dd"));
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: "0.65rem",
          width: "100%", textAlign: "left", cursor: "pointer",
          background: "#18181b",
          border: `1px solid ${open ? "rgba(232,25,138,0.5)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: "0.5rem",
          padding: "0.75rem 1rem",
          color: label ? "var(--cream)" : "#52525b",
          fontSize: "1rem",
          fontFamily: "var(--font-dm)",
          minHeight: 48,
          transition: "border-color 0.2s",
        }}
      >
        <CalendarDays size={16} style={{ color: "var(--gold)", flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{label ?? "Selecciona la fecha de tu evento"}</span>
        <ChevronDown size={14} style={{
          color: "#52525b", flexShrink: 0,
          transform: open ? "rotate(180deg)" : "none",
          transition: "transform 0.2s",
        }} />
      </button>

      {/* Calendario desplegable */}
      {open && (
        <div className="wizard-calendar" style={{
          position: "absolute", zIndex: 100, top: "calc(100% + 6px)", left: 0,
          background: "#0f0f13",
          border: "1px solid rgba(232,25,138,0.2)",
          borderRadius: 12,
          boxShadow: "0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(232,25,138,0.08)",
          padding: "0.5rem",
          minWidth: 300,
        }}>
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            locale={es}
            disabled={{ before: today }}
            showOutsideDays
            startMonth={today}
          />
        </div>
      )}
    </div>
  );
}
