"use client";
import { useState } from "react";
import Link from "next/link";

const WHATSAPP = "524929496372";

const TOPICS = [
  "Boda",
  "XV Años",
  "Cumpleaños / Fiesta",
  "Evento corporativo",
  "Otro",
];

export default function ContactoPage() {
  const [form, setForm]   = useState({ name: "", phone: "", email: "", topic: "", message: "", date: "" });
  const [sent, setSent]   = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const sendWA = (e: React.FormEvent) => {
    e.preventDefault();
    const text = [
      `Hola, me contacto desde daysu.vip ✨`,
      `*Nombre:* ${form.name}`,
      form.phone   ? `*Teléfono:* ${form.phone}`   : "",
      form.email   ? `*Email:* ${form.email}`       : "",
      form.topic   ? `*Tipo de evento:* ${form.topic}` : "",
      form.date    ? `*Fecha tentativa:* ${form.date}` : "",
      form.message ? `*Mensaje:* ${form.message}`   : "",
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank");
    setSent(true);
  };

  return (
    <div style={{ maxWidth: "52rem", margin: "0 auto", padding: "5rem 1.25rem 6rem", color: "var(--cream)" }}>
      <header style={{ marginBottom: "3rem" }}>
        <p className="section-label">Escríbenos</p>
        <h1 className="bebas" style={{ fontSize: "clamp(2.5rem,5vw,4rem)", marginTop: "0.5rem", lineHeight: 1 }}>Contáctanos</h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "0.75rem" }}>
          Cuéntanos sobre tu evento y te respondemos en menos de 24 horas.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "3rem", alignItems: "start" }}>

        {/* Formulario */}
        <div>
          {sent ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</p>
              <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "#f4f4f5", marginBottom: "0.5rem" }}>¡Mensaje enviado!</p>
              <p style={{ color: "#71717a", fontSize: "0.88rem", marginBottom: "2rem" }}>Te redirigimos a WhatsApp. Responderemos en breve.</p>
              <button onClick={() => setSent(false)}
                style={{ fontSize: "0.8rem", color: "var(--gold)", background: "none", border: "none", cursor: "pointer" }}>
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={sendWA} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label htmlFor="c-name" style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#52525b", marginBottom: "0.4rem" }}>
                  Nombre completo *
                </label>
                <input id="c-name" required value={form.name} onChange={set("name")}
                  placeholder="Juan García López" autoComplete="name"
                  className="aura-input" style={{ fontSize: "1rem" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label htmlFor="c-phone" style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#52525b", marginBottom: "0.4rem" }}>
                    Teléfono *
                  </label>
                  <input id="c-phone" type="tel" required value={form.phone} onChange={set("phone")}
                    placeholder="492 123 4567" autoComplete="tel"
                    className="aura-input" style={{ fontSize: "1rem" }} />
                </div>
                <div>
                  <label htmlFor="c-email" style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#52525b", marginBottom: "0.4rem" }}>
                    Correo (opcional)
                  </label>
                  <input id="c-email" type="email" value={form.email} onChange={set("email")}
                    placeholder="juan@correo.com" autoComplete="email"
                    className="aura-input" style={{ fontSize: "1rem" }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label htmlFor="c-topic" style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#52525b", marginBottom: "0.4rem" }}>
                    Tipo de evento
                  </label>
                  <select id="c-topic" value={form.topic} onChange={set("topic")}
                    className="aura-select" style={{ fontSize: "1rem" }}>
                    <option value="">Selecciona…</option>
                    {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="c-date" style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#52525b", marginBottom: "0.4rem" }}>
                    Fecha tentativa
                  </label>
                  <input id="c-date" type="date" value={form.date} onChange={set("date")}
                    className="aura-input" style={{ fontSize: "1rem" }} />
                </div>
              </div>

              <div>
                <label htmlFor="c-msg" style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#52525b", marginBottom: "0.4rem" }}>
                  Mensaje
                </label>
                <textarea id="c-msg" value={form.message} onChange={set("message")}
                  rows={4} placeholder="Cuéntanos sobre tu evento: número de invitados, venue, servicios de interés…"
                  className="aura-input" style={{ resize: "vertical", minHeight: 100, fontSize: "1rem" }} />
              </div>

              <button type="submit" disabled={!form.name || !form.phone}
                className="btn-gold"
                style={{ marginTop: "0.25rem", padding: "0.875rem", fontSize: "0.85rem", opacity: (!form.name || !form.phone) ? 0.4 : 1, cursor: (!form.name || !form.phone) ? "not-allowed" : "pointer" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#05051a" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                Enviar por WhatsApp
              </button>
              <p style={{ fontSize: "0.72rem", color: "#3f3f46", textAlign: "center" }}>
                El formulario abre WhatsApp con tu mensaje listo para enviar.
              </p>
            </form>
          )}
        </div>

        {/* Info lateral */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {[
            { icon: "📱", label: "WhatsApp", value: "+52 492 949 6372", href: `https://wa.me/${WHATSAPP}` },
            { icon: "📍", label: "Ubicación", value: "Guadalupe, Zacatecas, México", href: "https://maps.app.goo.gl/jECw9oHjjJikhovE8" },
            { icon: "⏰", label: "Horario", value: "Lun–Sáb 9:00–20:00", href: null },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", gap: "1rem", alignItems: "flex-start", background: "#0c0c0f", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.75rem", padding: "1rem 1.25rem" }}>
              <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>{item.icon}</span>
              <div>
                <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#52525b", marginBottom: "0.2rem" }}>{item.label}</p>
                {item.href ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer"
                    style={{ color: "#e4e4e7", fontSize: "0.88rem", textDecoration: "none" }}>
                    {item.value}
                  </a>
                ) : (
                  <p style={{ color: "#e4e4e7", fontSize: "0.88rem" }}>{item.value}</p>
                )}
              </div>
            </div>
          ))}

          <div style={{ background: "rgba(232,25,138,0.06)", border: "1px solid rgba(232,25,138,0.2)", borderRadius: "0.75rem", padding: "1.25rem" }}>
            <p style={{ color: "#f9a8d4", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.5rem" }}>¿Prefieres cotizar directo?</p>
            <p style={{ color: "#71717a", fontSize: "0.8rem", marginBottom: "1rem", lineHeight: 1.6 }}>
              Ve al formulario de reserva y verifica disponibilidad para tu fecha al instante.
            </p>
            <Link href="/reservar" className="btn-gold" style={{ textDecoration: "none", fontSize: "0.78rem", display: "inline-flex" }}>
              Cotizar ahora →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
