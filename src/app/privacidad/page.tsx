import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Política de privacidad y tratamiento de datos personales de Daysu.vip — Aura Producciones.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://daysu.vip/privacidad" },
};

const LAST_UPDATED = "30 de mayo de 2026";
const CONTACT_EMAIL = "contacto@daysu.vip";
const COMPANY = "Aura Producciones / Daysu.vip";
const ADDRESS = "Guadalupe, Zacatecas, México";

export default function PrivacidadPage() {
  return (
    <div style={{ maxWidth: "52rem", margin: "0 auto", padding: "5rem 1.25rem 6rem", color: "var(--cream)" }}>
      <header style={{ marginBottom: "3rem" }}>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 700, marginBottom: "0.75rem" }}>
          Legal
        </p>
        <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 300, letterSpacing: "-0.02em", marginBottom: "0.75rem" }}>
          Política de Privacidad
        </h1>
        <p style={{ fontSize: "0.82rem", color: "var(--muted)" }}>Última actualización: {LAST_UPDATED}</p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", fontSize: "0.9rem", lineHeight: 1.8, color: "#94a3b8" }}>

        <Section title="1. Responsable del tratamiento">
          <p><strong style={{ color: "var(--cream)" }}>{COMPANY}</strong>, con domicilio en {ADDRESS}, es responsable del tratamiento de tus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) de México.</p>
        </Section>

        <Section title="2. Datos que recopilamos">
          <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <li><strong style={{ color: "#e4e4e7" }}>Datos de contacto:</strong> nombre completo, teléfono, correo electrónico.</li>
            <li><strong style={{ color: "#e4e4e7" }}>Datos del evento:</strong> fecha, tipo de evento, número de invitados, dirección del venue.</li>
            <li><strong style={{ color: "#e4e4e7" }}>Datos de pago:</strong> procesados exclusivamente por Stripe. No almacenamos datos de tarjeta.</li>
            <li><strong style={{ color: "#e4e4e7" }}>Datos de uso:</strong> páginas visitadas, dispositivo y navegador (Google Analytics, con anonimización de IP).</li>
          </ul>
        </Section>

        <Section title="3. Finalidad del tratamiento">
          <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <li>Gestionar y confirmar tu reserva de servicio.</li>
            <li>Enviarte comunicaciones sobre tu evento (recordatorios, checklist).</li>
            <li>Procesar tu pago de depósito a través de Stripe.</li>
            <li>Mejorar nuestros servicios mediante análisis de uso del sitio.</li>
            <li>Enviarte promociones si otorgas tu consentimiento explícito.</li>
          </ul>
        </Section>

        <Section title="4. Base legal">
          <p>El tratamiento se basa en la ejecución de un contrato de servicio (reserva), el consentimiento que otorgas al completar el formulario de cotización, y nuestro interés legítimo en mejorar el servicio.</p>
        </Section>

        <Section title="5. Transferencia de datos">
          <p>No vendemos ni cedemos tus datos a terceros con fines comerciales. Compartimos datos únicamente con:</p>
          <ul style={{ paddingLeft: "1.25rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <li><strong style={{ color: "#e4e4e7" }}>Stripe Inc.</strong> — procesamiento de pagos.</li>
            <li><strong style={{ color: "#e4e4e7" }}>Vercel Inc.</strong> — alojamiento del sitio web.</li>
            <li><strong style={{ color: "#e4e4e7" }}>Google LLC</strong> — analítica (datos anonimizados).</li>
          </ul>
        </Section>

        <Section title="6. Tus derechos (ARCO)">
          <p>Tienes derecho a <strong style={{ color: "#e4e4e7" }}>Acceder, Rectificar, Cancelar u Oponerte</strong> al tratamiento de tus datos enviando una solicitud a:</p>
          <p style={{ marginTop: "0.75rem" }}>
            <a href={`mailto:${CONTACT_EMAIL}`}
              style={{ color: "var(--gold)", textDecoration: "none" }}>
              {CONTACT_EMAIL}
            </a>
          </p>
          <p style={{ marginTop: "0.5rem" }}>Responderemos en un plazo máximo de 20 días hábiles.</p>
        </Section>

        <Section title="7. Retención de datos">
          <p>Conservamos tus datos durante el tiempo necesario para la prestación del servicio y hasta 3 años posteriores para efectos de facturación y cumplimiento fiscal.</p>
        </Section>

        <Section title="8. Cookies">
          <p>Utilizamos cookies técnicas (necesarias para el funcionamiento del sitio) y cookies analíticas (Google Analytics). Puedes desactivar las cookies analíticas en la configuración de tu navegador.</p>
        </Section>

        <Section title="9. Cambios a esta política">
          <p>Notificaremos cualquier cambio relevante publicando la versión actualizada en esta página con la fecha de modificación.</p>
        </Section>

        <Section title="10. Contacto">
          <p>Para cualquier consulta sobre privacidad: <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "var(--gold)", textDecoration: "none" }}>{CONTACT_EMAIL}</a></p>
          <p style={{ marginTop: "0.4rem" }}>{COMPANY} · {ADDRESS}</p>
        </Section>
      </div>

      <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
        <Link href="/" style={{ fontSize: "0.8rem", color: "var(--muted)", textDecoration: "none" }}>← Inicio</Link>
        <Link href="/terminos" style={{ fontSize: "0.8rem", color: "var(--muted)", textDecoration: "none" }}>Términos de Servicio</Link>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#e4e4e7", marginBottom: "0.75rem", letterSpacing: "-0.01em" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}
