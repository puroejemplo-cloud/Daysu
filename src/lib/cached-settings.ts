import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/** Configuración de WhatsApp — cacheado 5 min, invalidado al guardar system_settings. */
export const getWhatsAppSettings = unstable_cache(
  async (): Promise<{ number?: string; message?: string }> => {
    try {
      const [waN, waM] = await Promise.all([
        prisma.systemSetting.findUnique({ where: { key: "whatsapp_number" } }),
        prisma.systemSetting.findUnique({ where: { key: "whatsapp_message" } }),
      ]);
      return { number: waN?.value, message: waM?.value };
    } catch {
      return {};
    }
  },
  ["whatsapp-settings"],
  { revalidate: 300, tags: ["system-settings"] }
);

/** Paquetes seleccionados para la homepage — cacheado 5 min. */
export const getHomepagePackageIds = unstable_cache(
  async (): Promise<number[]> => {
    try {
      const setting = await prisma.systemSetting.findUnique({ where: { key: "homepage_packages" } });
      if (!setting?.value) return [];
      return JSON.parse(setting.value) as number[];
    } catch {
      return [];
    }
  },
  ["homepage-packages"],
  { revalidate: 300, tags: ["system-settings"] }
);
