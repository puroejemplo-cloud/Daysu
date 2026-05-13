"use client";

import { useState } from "react";
import { Loader2, Phone, Globe, MapPin, ChevronRight, AtSign } from "lucide-react";

/* ── Paleta del formulario ─────────────────────────────────── */
const GOLD   = "#D4AF37";
const VIOLET = "#7C3AED";

const EVENT_TYPES = ["Boda", "XV Años", "Fiesta", "Evento Corporativo", "Graduación", "Otro"];

const BUDGET_RANGES = [
  "Menos de $30,000",
  "$30,000 – $60,000",
  "$60,000 – $100,000",
  "$100,000 – $150,000",
  "Más de $150,000",
  "Aún no lo tengo definido",
];

/* ── Tipos ────────────────────────────────────────────────── */
interface FormState {
  name: string; email: string; phone: string;
  eventType: string; eventDate: string;
  guestCount: string; budget: string; message: string;
}
type Field = keyof FormState;

const INITIAL: FormState = {
  name: "", email: "", phone: "", eventType: "",
  eventDate: "", guestCount: "", budget: "", message: "",
};

function validate(f: FormState): Partial<Record<Field, string>> {
  return {
    name:      !f.name.trim()  ? "Tu nombre es requerido" : "",
    email:     !f.email.trim() ? "El email es requerido"
               : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) ? "Formato de email inválido" : "",
    phone:     !f.phone.trim() ? "Tu teléfono es requerido" : "",
    eventType: !f.eventType    ? "Selecciona un tipo de evento" : "",
  };
}

/* ── Estilos reutilizables ────────────────────────────────── */
const inputBase: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: "0.625rem",
  color: "#f5f0e8",
  fontSize: "0.875rem",
  padding: "0.7rem 0.9rem",
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
};

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(245,240,232,0.55)", marginBottom: "0.4rem" }}>
      {children}{required && <span style={{ color: GOLD, marginLeft: 2 }}>*</span>}
    </label>
  );
}

function ErrorMsg({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p style={{ fontSize: "0.7rem", color: "#f87171", marginTop: "0.3rem", display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#f87171", flexShrink: 0, display: "inline-block" }} />
      {msg}
    </p>
  );
}

/* ── Componente principal ─────────────────────────────────── */
export function WeddingForm({ compact = false }: { compact?: boolean }) {
  const [form,    setForm]    = useState<FormState>(INITIAL);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  const errors  = validate(form);
  const isValid = Object.values(errors).every((e) => !e);

  function set(field: Field, value: string) { setForm((f) => ({ ...f, [field]: value })); }
  function touch(field: Field)              { setTouched((t) => ({ ...t, [field]: true })); }

  function inputStyle(field?: Field): React.CSSProperties {
    const isFocused = focused === field;
    const hasError  = field && touched[field] && errors[field];
    return {
      ...inputBase,
      borderColor:  hasError ? "rgba(248,113,113,0.5)" : isFocused ? `rgba(212,175,55,0.45)` : "rgba(255,255,255,0.09)",
      boxShadow:    hasError ? "0 0 0 3px rgba(248,113,113,0.08)" : isFocused ? `0 0 0 3px rgba(212,175,55,0.08)` : "none",
      background:   isFocused ? "rgba(212,175,55,0.04)" : "rgba(255,255,255,0.04)",
    };
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
          eventDate:  form.eventDate  || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Error al enviar");
      }
      setSubmitted(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Ocurrió un error. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  /* ── Success state ──────────────────────────────────────── */
  if (submitted) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: `rgba(212,175,55,0.12)`, border: `1px solid rgba(212,175,55,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", fontSize: "1.5rem" }}>
          ✨
        </div>
        <p style={{ fontSize: "1.5rem", fontWeight: 600, color: "#f5f0e8", marginBottom: 8 }}>¡Solicitud recibida!</p>
        <p style={{ color: "rgba(245,240,232,0.55)", fontSize: "0.9rem", maxWidth: 340, margin: "0 auto" }}>
          Nos pondremos en contacto contigo muy pronto para comenzar a diseñar tu evento perfecto.
        </p>
      </div>
    );
  }

  /* ── Form layout ────────────────────────────────────────── */
  const formFields = (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Nombre */}
      <div>
        <Label required>Nombre completo</Label>
        <input id="wf-name" className="wf-input" style={inputStyle("name")}
          value={form.name} placeholder="Tu nombre"
          onChange={(e) => set("name", e.target.value)}
          onFocus={() => setFocused("name")} onBlur={() => { setFocused(null); touch("name"); }}
        />
        <ErrorMsg msg={touched.name ? errors.name : ""} />
      </div>

      {/* Email + Tel */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div>
          <Label required>Email</Label>
          <input id="wf-email" type="email" className="wf-input" style={inputStyle("email")}
            value={form.email} placeholder="tu@email.com"
            onChange={(e) => set("email", e.target.value)}
            onFocus={() => setFocused("email")} onBlur={() => { setFocused(null); touch("email"); }}
          />
          <ErrorMsg msg={touched.email ? errors.email : ""} />
        </div>
        <div>
          <Label required>Teléfono</Label>
          <input id="wf-phone" type="tel" className="wf-input" style={inputStyle("phone")}
            value={form.phone} placeholder="+52 492 000 0000"
            onChange={(e) => set("phone", e.target.value)}
            onFocus={() => setFocused("phone")} onBlur={() => { setFocused(null); touch("phone"); }}
          />
          <ErrorMsg msg={touched.phone ? errors.phone : ""} />
        </div>
      </div>

      {/* Tipo de evento */}
      <div>
        <Label required>Tipo de evento</Label>
        <select id="wf-type" className="wf-input" style={inputStyle("eventType")}
          value={form.eventType}
          onChange={(e) => set("eventType", e.target.value)}
          onFocus={() => setFocused("eventType")} onBlur={() => { setFocused(null); touch("eventType"); }}
        >
          <option value="">Selecciona...</option>
          {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <ErrorMsg msg={touched.eventType ? errors.eventType : ""} />
      </div>

      {/* Fecha + Invitados */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div>
          <Label>Fecha estimada</Label>
          <input id="wf-date" type="date" className="wf-input" style={inputStyle()}
            value={form.eventDate} min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => set("eventDate", e.target.value)}
            onFocus={() => setFocused("date")} onBlur={() => setFocused(null)}
          />
        </div>
        <div>
          <Label>Invitados aprox.</Label>
          <input id="wf-guests" type="number" min="1" className="wf-input" style={inputStyle()}
            value={form.guestCount} placeholder="100"
            onChange={(e) => set("guestCount", e.target.value)}
            onFocus={() => setFocused("guests")} onBlur={() => setFocused(null)}
          />
        </div>
      </div>

      {/* Presupuesto */}
      <div>
        <Label>Presupuesto estimado</Label>
        <select id="wf-budget" className="wf-input" style={inputStyle()}
          value={form.budget}
          onChange={(e) => set("budget", e.target.value)}
          onFocus={() => setFocused("budget")} onBlur={() => setFocused(null)}
        >
          <option value="">Selecciona un rango...</option>
          {BUDGET_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Mensaje */}
      <div>
        <Label>Cuéntanos tu visión</Label>
        <textarea id="wf-message" className="wf-input" style={{ ...inputStyle(), resize: "vertical" }}
          rows={3} value={form.message}
          placeholder="Colores, estilo, inspiración, lo que sueñas para tu evento..."
          onChange={(e) => set("message", e.target.value)}
          onFocus={() => setFocused("message")} onBlur={() => setFocused(null)}
        />
      </div>

      {serverError && (
        <p style={{ fontSize: "0.8rem", color: "#f87171", textAlign: "center" }}>{serverError}</p>
      )}

      {/* CTA */}
      <button type="submit" disabled={loading} className="wf-submit">
        {loading ? (
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Loader2 size={16} className="animate-spin" /> Enviando...
          </span>
        ) : (
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            Solicitar Consulta de Diseño
            <ChevronRight size={16} className="wf-arrow" />
          </span>
        )}
        <span className="wf-shimmer" />
      </button>
    </form>
  );

  /* ── Compact (sin info lateral) ─────────────────────────── */
  if (compact) {
    return (
      <div style={{ padding: "1.25rem 1.25rem 1.5rem" }}>
        {formFields}
        <WfStyles />
      </div>
    );
  }

  /* ── Full layout (dos columnas) ─────────────────────────── */
  return (
    <section id="contacto" style={{ background: "#05051a", padding: "5rem 1.25rem" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.2em", color: GOLD, textTransform: "uppercase", marginBottom: 10 }}>
            ✦ Wedding Planner ✦
          </p>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, color: "#f5f0e8", lineHeight: 1.2, margin: 0 }}>
            Diseñemos juntos tu<br />
            <span style={{ color: GOLD }}>evento perfecto</span>
          </h2>
        </div>

        {/* Two-column grid */}
        <div className="wf-grid">

          {/* ── Columna izquierda: info ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem", justifyContent: "center" }}>
            <div>
              <p style={{ color: "rgba(245,240,232,0.7)", fontSize: "0.95rem", lineHeight: 1.8, marginBottom: "1.5rem" }}>
                Cada evento es único. Nos encargamos de cada detalle, desde la conceptualización hasta el último minuto, para que tú solo disfrutes.
              </p>
              <div style={{ width: 48, height: 2, background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
            </div>

            {/* Contacto */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {[
                { Icon: Phone,     text: "+52 492 949 6372",  sub: "WhatsApp disponible" },
                { Icon: AtSign,    text: "@daysu.vip",         sub: "Síguenos en Instagram" },
                { Icon: Globe,     text: "daysu.vip",          sub: "Visita nuestro sitio" },
                { Icon: MapPin,    text: "Zacatecas, México",  sub: "Servicio en todo Zacatecas" },
              ].map(({ Icon, text, sub }) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: `rgba(212,175,55,0.1)`, border: `1px solid rgba(212,175,55,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={15} style={{ color: GOLD }} />
                  </div>
                  <div>
                    <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#f5f0e8", margin: 0 }}>{text}</p>
                    <p style={{ fontSize: "0.7rem", color: "rgba(245,240,232,0.4)", margin: 0 }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Decorative quote */}
            <blockquote style={{ margin: 0, paddingLeft: "1rem", borderLeft: `2px solid rgba(212,175,55,0.3)` }}>
              <p style={{ color: "rgba(245,240,232,0.45)", fontSize: "0.82rem", fontStyle: "italic", lineHeight: 1.7, margin: 0 }}>
                "Transformamos tus ideas en momentos que duran para siempre."
              </p>
            </blockquote>
          </div>

          {/* ── Columna derecha: formulario ── */}
          <div style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "1.25rem",
            padding: "2rem 1.75rem",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}>
            {formFields}
          </div>
        </div>
      </div>
      <WfStyles />
    </section>
  );
}

/* ── CSS inyectado ─────────────────────────────────────────── */
function WfStyles() {
  return (
    <style>{`
      .wf-input {
        font-family: inherit;
        color-scheme: dark;
      }
      .wf-input option {
        background: #09090b;
        color: #f5f0e8;
      }
      .wf-grid {
        display: grid;
        grid-template-columns: 1fr 1.25fr;
        gap: 3.5rem;
        align-items: start;
      }
      @media (max-width: 700px) {
        .wf-grid { grid-template-columns: 1fr; gap: 2.5rem; }
      }
      .wf-submit {
        position: relative; overflow: hidden;
        width: 100%;
        background: linear-gradient(135deg, #D4AF37 0%, #b8932a 100%);
        color: #05051a;
        border: none;
        border-radius: 0.75rem;
        padding: 0.9rem 1.5rem;
        font-size: 0.9rem;
        font-weight: 700;
        font-family: inherit;
        letter-spacing: 0.02em;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;
        box-shadow: 0 4px 24px rgba(212,175,55,0.2);
        margin-top: 0.5rem;
      }
      .wf-submit:hover:not(:disabled) {
        transform: translateY(-2px) scale(1.01);
        box-shadow: 0 8px 32px rgba(212,175,55,0.35);
        filter: brightness(1.08);
      }
      .wf-submit:active:not(:disabled) {
        transform: translateY(0) scale(0.99);
      }
      .wf-submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .wf-arrow {
        transition: transform 0.2s;
      }
      .wf-submit:hover .wf-arrow {
        transform: translateX(4px);
      }
      .wf-shimmer {
        position: absolute; top: 0; left: -80%;
        width: 60%; height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
        transform: skewX(-15deg);
        animation: wfShimmer 3s infinite;
      }
      @keyframes wfShimmer {
        0%   { left: -80%; }
        50%  { left: 130%; }
        100% { left: 130%; }
      }
    `}</style>
  );
}
