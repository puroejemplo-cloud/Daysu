import { prisma } from "@/lib/prisma";
import { WeddingHero } from "@/components/wedding/WeddingHero";
import { WeddingGallery } from "@/components/wedding/WeddingGallery";
import { WeddingSteps } from "@/components/wedding/WeddingSteps";
import { WeddingTestimonials } from "@/components/wedding/WeddingTestimonials";
import { WeddingForm } from "@/components/wedding/WeddingForm";

export const revalidate = 300;

const DEFAULTS = {
  eventTypes: ["Boda", "XV Años", "Fiesta", "Evento Corporativo", "Graduación"],
  galleryImages: [] as string[],
  testimonials: [] as { name: string; eventType: string; text: string }[],
  heroSubtitle: "Nos encargamos de cada detalle para que tú solo disfrutes.",
  steps: [
    { title: "Nos contactas", desc: "Cuéntanos tu idea y fecha tentativa." },
    { title: "Planificamos todo", desc: "Coordinamos proveedores, logística y detalles." },
    { title: "Tú solo disfrutas", desc: "El día del evento, nosotros nos encargamos." },
  ],
};

async function getWpSettings() {
  const rows = await prisma.systemSetting.findMany({
    where: { key: { startsWith: "wp_" } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    eventTypes: map.wp_event_types
      ? (JSON.parse(map.wp_event_types) as string[])
      : DEFAULTS.eventTypes,
    galleryImages: map.wp_gallery_images
      ? (JSON.parse(map.wp_gallery_images) as string[])
      : DEFAULTS.galleryImages,
    testimonials: map.wp_testimonials
      ? (JSON.parse(map.wp_testimonials) as typeof DEFAULTS.testimonials)
      : DEFAULTS.testimonials,
    heroSubtitle: map.wp_hero_subtitle ?? DEFAULTS.heroSubtitle,
    heroImage: map.wp_hero_image ?? null,
    steps: map.wp_steps
      ? (JSON.parse(map.wp_steps) as typeof DEFAULTS.steps)
      : DEFAULTS.steps,
  };
}

export default async function WeddingPlannerPage() {
  const settings = await getWpSettings();

  return (
    <main>
      <WeddingHero eventTypes={settings.eventTypes} subtitle={settings.heroSubtitle} heroImage={settings.heroImage ?? undefined} />
      <WeddingGallery images={settings.galleryImages} />
      <WeddingSteps steps={settings.steps} />
      <WeddingTestimonials testimonials={settings.testimonials} />
      <WeddingForm />
    </main>
  );
}
