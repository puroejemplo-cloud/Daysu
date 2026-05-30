import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos de Servicio",
  description: "Términos y condiciones de contratación de servicios de Daysu.vip — Aura Producciones.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "30 de mayo de 2026";
const CONTACT_EMAIL = "contacto@daysu.vip";
const COMPANY = "Aura Producciones / Daysu.vip";

export default function TerminosPage() {
  return (
    <div style={{ maxWidth: "52rem", margin: "0 auto", padding: "5rem 1.25rem 6rem", color: "var(--cream)" }}>
      <header style={{ marginBottom: "3rem" }}>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 700, marginBottom: "0.75rem" }}>
          Legal
        </p>
        <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 300, letterSpacing: "-0.02em", marginBottom: "0.75rem" }}>
          Términos de Servicio
        </h1>
        <p style={{ fontSize: "0.82rem", color: "var(--muted)" }}>Última actualización: {LAST_UPDATED}</p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", fontSize: "0.9rem", lineHeight: 1.8, color: "#94a3b8" }}>

        <Section title="1. Aceptación">
          <p>Al realizar una reserva en Daysu.vip aceptas estos Términos de Servicio. Si no estás de acuerdo, abstente de contratar nuestros servicios.</p>
        </Section>

        <Section title="2. Descripción del servicio">
          <p><strong style={{ color: "#e4e4e7" }}>{COMPANY}</strong> ofrece servicios de DJ, audio, iluminación, entretenimiento y shows para eventos sociales en Zacatecas y zona conurbada.</p>
        </Section>

        <Section title="3. Proceso de reserva y pago">
          <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <li>La reserva se confirma con el pago del <strong style={{ color: "#e4e4e7" }}>30% de depósito</strong>.</li>
            <li>El 70% restante se liquida el día del evento o según acuerdo escrito previo.</li>
            <li>El depósito se procesa a través de <strong style={{ color: "#e4e4e7" }}>Stripe</strong>. Los datos de pago son manejados exclusivamente por Stripe y no son almacenados por nosotros.</li>
            <li>La reserva se activa únicamente tras la confirmación del pago por parte de Stripe.</li>
          </ul>
        </Section>

        <Section title="4. Política de cancelación y reembolso">
          <p style={{ marginBottom: "0.75rem" }}>
            El depósito pagado al momento de la reserva <strong style={{ color: "#e4e4e7" }}>no es reembolsable</strong> bajo ninguna circunstancia, ya que cubre el bloqueo de la fecha en la agenda y los costos de coordinación previa al evento.
          </p>
          <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <li><strong style={{ color: "#e4e4e7" }}>Cancelación por el cliente:</strong> sin reembolso del depósito.</li>
            <li><strong style={{ color: "#e4e4e7" }}>Cambio de fecha:</strong> sujeto a disponibilidad. El depósito se traslada a la nueva fecha si se solicita con al menos 15 días de anticipación.</li>
            <li><strong style={{ color: "#e4e4e7" }}>Cancelación por causa nuestra (fuerza mayor):</strong> se reembolsa el 100% del depósito o se reagenda sin costo.</li>
          </ul>
        </Section>

        <Section title="5. Cobertura geográfica y traslado">
          <p>El servicio base cubre la zona conurbada Zacatecas–Guadalupe. Eventos fuera de esta zona tienen un cargo adicional por traslado de equipo, acordado previamente por escrito.</p>
        </Section>

        <Section title="6. Responsabilidades del cliente">
          <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <li>Proporcionar acceso al venue al menos 2 horas antes del evento para instalación.</li>
            <li>Contar con suministro eléctrico adecuado (110V/220V según requerimiento del paquete).</li>
            <li>Informar cambios de fecha o lugar con mínimo 15 días de anticipación.</li>
          </ul>
        </Section>

        <Section title="7. Limitación de responsabilidad">
          <p>No nos hacemos responsables por daños derivados de casos de fuerza mayor (desastres naturales, cortes de energía, disturbios), ni por daños indirectos al cliente o sus invitados.</p>
        </Section>

        <Section title="8. Propiedad intelectual">
          <p>El contenido del sitio web (textos, imágenes, videos, logotipos) es propiedad de {COMPANY}. Queda prohibida su reproducción sin autorización expresa por escrito.</p>
        </Section>

        <Section title="9. Modificaciones">
          <p>Nos reservamos el derecho de modificar estos términos. Los cambios se notificarán en esta página con la fecha de actualización.</p>
        </Section>

        <Section title="10. Ley aplicable">
          <p>Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier controversia se somete a los tribunales competentes de Zacatecas, Zac.</p>
        </Section>

        <Section title="11. Contacto">
          <p>Dudas sobre estos términos: <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "var(--gold)", textDecoration: "none" }}>{CONTACT_EMAIL}</a></p>
        </Section>
      </div>

      <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
        <Link href="/" style={{ fontSize: "0.8rem", color: "var(--muted)", textDecoration: "none" }}>← Inicio</Link>
        <Link href="/privacidad" style={{ fontSize: "0.8rem", color: "var(--muted)", textDecoration: "none" }}>Política de Privacidad</Link>
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
