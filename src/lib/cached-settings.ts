import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";

/** Configuración de WhatsApp — se cachea por horas, se invalida al guardar system_settings. */
export async function getWhatsAppSettings(): Promise<{ number?: string; message?: string }> {
  "use cache";
  cacheLife("default");
  cacheTag("system-settings");

  try {
    const [waN, waM] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: "whatsapp_number" } }),
      prisma.systemSetting.findUnique({ where: { key: "whatsapp_message" } }),
    ]);
    return { number: waN?.value, message: waM?.value };
  } catch {
    return {};
  }
}

/** Paquetes seleccionados para la homepage — se cachea por minutos. */
export async function getHomepagePackageIds(): Promise<number[]> {
  "use cache";
  cacheLife("default");
  cacheTag("system-settings");

  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: "homepage_packages" } });
    if (!setting?.value) return [];
    return JSON.parse(setting.value) as number[];
  } catch {
    return [];
  }
}
