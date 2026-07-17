import Link from "next/link";
import { Sparkles } from "lucide-react";

interface Props {
  image?: string | null;
}

/** Sección fija del home que presenta la alianza con la wedding planner.
 *  Reemplaza a la antigua barra flotante (WeddingFloatingCTA), que competía
 *  con el banner de cookies y el botón de WhatsApp durante todo el scroll. */
export default function WeddingPlannerBanner({ image }: Props) {
  return (
    <section style={{ padding: "4rem 1.25rem", borderTop: "1px solid rgba(255,255,255,.05)", background: "rgba(232,25,138,0.03)" }}>
      <div style={{
        maxWidth: 760, margin: "0 auto",
        display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap",
        background: "rgba(9,9,11,0.85)",
        border: "1px solid rgba(232,25,138,0.25)",
        borderRadius: "1.25rem",
        padding: "1.75rem 2rem",
      }}>
        {image && (
          <div style={{
            width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
            background: `url('${image}') center/cover`,
            border: "2px solid var(--gold)",
          }} />
        )}
        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
          <p style={{ fontSize: "0.65rem", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.35rem" }}>
            <Sparkles size={11} style={{ display: "inline", verticalAlign: "-1px", marginRight: 4, color: "var(--gold)" }} />
            Wedding Planner · Pao Rosales
          </p>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--cream)", lineHeight: 1.35 }}>
            ¿Nos encargamos de tu boda o evento?
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#a1a1aa", marginTop: "0.35rem", lineHeight: 1.6 }}>
            Planeación completa de bodas, XV años y eventos empresariales, de la mano del equipo de Daysu.
          </p>
        </div>
        <Link href="/wedding-planner#contacto" className="btn-gold" style={{ flexShrink: 0, textDecoration: "none" }}>
          Sí, platícanos →
        </Link>
      </div>
    </section>
  );
}
