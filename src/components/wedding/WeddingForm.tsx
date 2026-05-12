"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

const EVENT_TYPES = ["Boda", "XV Años", "Fiesta", "Evento Corporativo", "Graduación", "Otro"];

interface FormState {
  name: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  guestCount: string;
  budget: string;
  message: string;
}

type Field = keyof FormState;

const INITIAL: FormState = {
  name: "", email: "", phone: "", eventType: "",
  eventDate: "", guestCount: "", budget: "", message: "",
};

function validate(form: FormState): Partial<Record<Field, string>> {
  return {
    name: !form.name.trim() ? "Nombre requerido" : "",
    email: !form.email.trim()
      ? "Email requerido"
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
      ? "Email inválido"
      : "",
    phone: !form.phone.trim() ? "Teléfono requerido" : "",
    eventType: !form.eventType ? "Selecciona un tipo de evento" : "",
  };
}

export function WeddingForm({ compact = false }: { compact?: boolean }) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const errors = validate(form);
  const isValid = Object.values(errors).every((e) => !e);

  function set(field: Field, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function touch(field: Field) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true, eventType: true });
    if (!isValid) return;
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch("/api/wedding-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          guestCount: form.guestCount ? parseInt(form.guestCount, 10) : undefined,
          eventDate: form.eventDate || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Error al enviar");
      }
      setSubmitted(true);
    } catch (e) {
      setServerError(
        e instanceof Error ? e.message : "Ocurrió un error. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-16">
        <p className="text-3xl font-semibold mb-3" style={{ color: "var(--gold)" }}>
          ¡Solicitud recibida!
        </p>
        <p style={{ color: "var(--cream)" }}>
          Te contactaremos pronto para comenzar a planificar tu evento.
        </p>
      </div>
    );
  }

  return (
    <section
      id="contacto"
      className={compact ? "px-5 py-5" : "py-16 px-4"}
      style={{ background: compact ? "transparent" : "#0a0a1a" }}
    >
      <div className="max-w-2xl mx-auto">
        {!compact && (
          <>
            <h2
              className="text-center text-3xl font-semibold mb-2"
              style={{ color: "var(--cream)" }}
            >
              Comencemos a planificar
            </h2>
            <p className="text-center text-sm mb-10" style={{ color: "var(--muted)" }}>
              Cuéntanos sobre tu evento y te contactamos en menos de 24 horas.
            </p>
          </>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Nombre */}
          <div>
            <label htmlFor="wp-name" className="block text-sm mb-1" style={{ color: "var(--cream)" }}>
              Nombre completo *
            </label>
            <input
              id="wp-name"
              className="aura-input w-full"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              onBlur={() => touch("name")}
              placeholder="Tu nombre"
            />
            {touched.name && errors.name && (
              <p className="text-xs mt-1" style={{ color: "var(--red)" }}>{errors.name}</p>
            )}
          </div>

          {/* Email + Tel */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="wp-email" className="block text-sm mb-1" style={{ color: "var(--cream)" }}>
                Email *
              </label>
              <input
                id="wp-email"
                type="email"
                className="aura-input w-full"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                onBlur={() => touch("email")}
                placeholder="tu@email.com"
              />
              {touched.email && errors.email && (
                <p className="text-xs mt-1" style={{ color: "var(--red)" }}>{errors.email}</p>
              )}
            </div>
            <div>
              <label htmlFor="wp-phone" className="block text-sm mb-1" style={{ color: "var(--cream)" }}>
                Teléfono *
              </label>
              <input
                id="wp-phone"
                type="tel"
                className="aura-input w-full"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                onBlur={() => touch("phone")}
                placeholder="+52 492 000 0000"
              />
              {touched.phone && errors.phone && (
                <p className="text-xs mt-1" style={{ color: "var(--red)" }}>{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Tipo de evento */}
          <div>
            <label htmlFor="wp-event-type" className="block text-sm mb-1" style={{ color: "var(--cream)" }}>
              Tipo de evento *
            </label>
            <select
              id="wp-event-type"
              className="aura-input w-full"
              value={form.eventType}
              onChange={(e) => set("eventType", e.target.value)}
              onBlur={() => touch("eventType")}
            >
              <option value="">Selecciona...</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {touched.eventType && errors.eventType && (
              <p className="text-xs mt-1" style={{ color: "var(--red)" }}>{errors.eventType}</p>
            )}
          </div>

          {/* Fecha + Invitados */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="wp-date" className="block text-sm mb-1" style={{ color: "var(--cream)" }}>
                Fecha estimada
              </label>
              <input
                id="wp-date"
                type="date"
                className="aura-input w-full"
                value={form.eventDate}
                onChange={(e) => set("eventDate", e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div>
              <label htmlFor="wp-guests" className="block text-sm mb-1" style={{ color: "var(--cream)" }}>
                Número de invitados
              </label>
              <input
                id="wp-guests"
                type="number"
                min="1"
                className="aura-input w-full"
                value={form.guestCount}
                onChange={(e) => set("guestCount", e.target.value)}
                placeholder="Aprox."
              />
            </div>
          </div>

          {/* Presupuesto */}
          <div>
            <label htmlFor="wp-budget" className="block text-sm mb-1" style={{ color: "var(--cream)" }}>
              Presupuesto aproximado
            </label>
            <input
              id="wp-budget"
              className="aura-input w-full"
              value={form.budget}
              onChange={(e) => set("budget", e.target.value)}
              placeholder="Ej: $50,000 – $80,000"
            />
          </div>

          {/* Mensaje */}
          <div>
            <label htmlFor="wp-message" className="block text-sm mb-1" style={{ color: "var(--cream)" }}>
              Cuéntanos más
            </label>
            <textarea
              id="wp-message"
              className="aura-input w-full"
              rows={4}
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              placeholder="Comparte detalles, ideas o dudas sobre tu evento..."
              style={{ resize: "vertical" }}
            />
          </div>

          {serverError && (
            <p className="text-sm" style={{ color: "var(--red)" }}>{serverError}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full py-4 text-base rounded-full"
            aria-busy={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" /> Enviando...
              </span>
            ) : (
              "Enviar solicitud"
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
