import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { WeddingHero } from "@/components/wedding/WeddingHero";
import { WeddingGallery } from "@/components/wedding/WeddingGallery";
import { WeddingSteps } from "@/components/wedding/WeddingSteps";
import { WeddingTestimonials } from "@/components/wedding/WeddingTestimonials";
import { WeddingForm } from "@/components/wedding/WeddingForm";

export const revalidate = 300;

const DEFAULTS = {
  eventTypes:   ["Boda", "XV Años", "Fiesta", "Evento Corporativo", "Graduación"],
  galleryImages: [] as string[],
  testimonials:  [] as { name: string; eventType: string; text: string }[],
  heroSubtitle:  "Nos encargamos de cada detalle para que tú solo disfrutes.",
  steps: [
    { title: "Nos contactas",   desc: "Cuéntanos tu idea y fecha tentativa." },
    { title: "Planificamos todo", desc: "Coordinamos proveedores, logística y detalles." },
    { title: "Tú solo disfrutas", desc: "El día del evento, nosotros nos encargamos." },
  ],
};

const STATS = [
  { value: "50+",   label: "Eventos realizados" },
  { value: "500+",  label: "Invitados atendidos" },
  { value: "100%",  label: "Clientes satisfechos" },
];

async function getWpSettings() {
  const rows = await prisma.systemSetting.findMany({ where: { key: { startsWith: "wp_" } } });
  const map  = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    eventTypes:    map.wp_event_types    ? (JSON.parse(map.wp_event_types)    as string[])                                          : DEFAULTS.eventTypes,
    galleryImages: map.wp_gallery_images ? (JSON.parse(map.wp_gallery_images) as string[])                                          : DEFAULTS.galleryImages,
    testimonials:  map.wp_testimonials   ? (JSON.parse(map.wp_testimonials)   as typeof DEFAULTS.testimonials)                      : DEFAULTS.testimonials,
    heroSubtitle:  map.wp_hero_subtitle  ?? DEFAULTS.heroSubtitle,
    heroImage:     map.wp_hero_image     ?? null,
    steps:         map.wp_steps          ? (JSON.parse(map.wp_steps)          as typeof DEFAULTS.steps)                             : DEFAULTS.steps,
  };
}

export default async function WeddingPlannerPage() {
  const s = await getWpSettings();

  return (
    <main style={{ background: "var(--black)" }}>

      {/* ── Barra de navegación ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(5,5,26,0.85)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 1.25rem",
      }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", color: "var(--muted)", fontSize: "0.82rem" }}>
          <span style={{ fontSize: "1rem" }}>←</span> Daysu.vip
        </Link>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.4rem", textDecoration: "none" }}>
          <img src="/logo-daysu.png" alt="Daysu" style={{ width: 22, height: 22, objectFit: "contain" }} />
          <span style={{ fontWeight: 700, fontSize: "0.78rem", color: "#e4e4e7", letterSpacing: "0.08em" }}>DAYSU.VIP</span>
        </Link>
        <a href="#contacto" style={{
          background: "var(--gold)", color: "#05051a",
          borderRadius: "0.5rem", padding: "0.4rem 0.875rem",
          fontSize: "0.78rem", fontWeight: 700, textDecoration: "none",
          whiteSpace: "nowrap",
        }}>
          Contáctanos
        </a>
      </div>
      </nav>

      {/* Espacio para el nav fijo */}
      <div style={{ height: 52 }} />

      {/* ── Hero ── */}
      <WeddingHero
        eventTypes={s.eventTypes}
        subtitle={s.heroSubtitle}
        heroImage={s.heroImage ?? undefined}
      />

      {/* ── Stats ── */}
      <section style={{ background: "#0a0a1a", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", maxWidth: 600, margin: "0 auto" }}>
            {STATS.map(({ value, label }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <p style={{ fontSize: "2rem", fontWeight: 800, color: "#D4AF37", lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 4 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Galería ── */}
      <WeddingGallery images={s.galleryImages} />

      {/* ── Pasos ── */}
      <WeddingSteps steps={s.steps} />

      {/* ── Testimonios ── */}
      <WeddingTestimonials testimonials={s.testimonials} />

      {/* ── Formulario ── */}
      <WeddingForm />

    </main>
  );
}
