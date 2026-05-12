import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const WP_DEFAULTS = {
  wp_event_types: ["Boda", "XV Años", "Fiesta", "Evento Corporativo", "Graduación"],
  wp_gallery_images: [] as string[],
  wp_testimonials: [] as { name: string; eventType: string; text: string }[],
  wp_hero_subtitle: "Nos encargamos de cada detalle para que tú solo disfrutes.",
  wp_steps: [
    { title: "Nos contactas", desc: "Cuéntanos tu idea y fecha tentativa." },
    { title: "Planificamos todo", desc: "Coordinamos proveedores, logística y detalles." },
    { title: "Tú solo disfrutas", desc: "El día del evento, nosotros nos encargamos." },
  ],
};

export async function GET() {
  const session = await auth();
  if (!session) return err("No autorizado", 401);

  const rows = await prisma.systemSetting.findMany({
    where: { key: { startsWith: "wp_" } },
  });

  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const settings = {
    wp_event_types: map.wp_event_types
      ? (JSON.parse(map.wp_event_types) as string[])
      : WP_DEFAULTS.wp_event_types,
    wp_gallery_images: map.wp_gallery_images
      ? (JSON.parse(map.wp_gallery_images) as string[])
      : WP_DEFAULTS.wp_gallery_images,
    wp_testimonials: map.wp_testimonials
      ? (JSON.parse(map.wp_testimonials) as typeof WP_DEFAULTS.wp_testimonials)
      : WP_DEFAULTS.wp_testimonials,
    wp_hero_subtitle: map.wp_hero_subtitle ?? WP_DEFAULTS.wp_hero_subtitle,
    wp_hero_image: map.wp_hero_image ?? null,
    wp_steps: map.wp_steps
      ? (JSON.parse(map.wp_steps) as typeof WP_DEFAULTS.wp_steps)
      : WP_DEFAULTS.wp_steps,
  };

  return ok(settings);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return err("No autorizado", 401);

  const body = await req.json() as Partial<typeof WP_DEFAULTS>;

  const updates: Array<{ key: string; value: string }> = [];

  if (body.wp_event_types !== undefined)
    updates.push({ key: "wp_event_types", value: JSON.stringify(body.wp_event_types) });
  if (body.wp_gallery_images !== undefined)
    updates.push({ key: "wp_gallery_images", value: JSON.stringify(body.wp_gallery_images) });
  if (body.wp_testimonials !== undefined)
    updates.push({ key: "wp_testimonials", value: JSON.stringify(body.wp_testimonials) });
  if (body.wp_hero_subtitle !== undefined)
    updates.push({ key: "wp_hero_subtitle", value: body.wp_hero_subtitle });
  if (body.wp_steps !== undefined)
    updates.push({ key: "wp_steps", value: JSON.stringify(body.wp_steps) });

  await Promise.all(
    updates.map((u) =>
      prisma.systemSetting.upsert({
        where: { key: u.key },
        update: { value: u.value },
        create: { key: u.key, value: u.value },
      })
    )
  );

  revalidatePath("/wedding-planner");

  return ok({ updated: updates.map((u) => u.key) });
}
