import { prisma } from "@/lib/prisma";
import { getAvailability } from "@/lib/availability";

export interface BookingItemInput {
  assetId: number;
  quantity: number;
  overridePrice?: number; // precio con descuento de upsell
}

/**
 * Expande los ítems BOM: por cada activo padre agrega sus componentes requeridos
 * como ítems auto-bloqueados, capturando el precio snapshot del padre (los
 * componentes no tienen precio propio).
 */
export async function expandBomItems(items: BookingItemInput[]) {
  const expanded: (BookingItemInput & { unitPrice: number; isAutoBlocked: boolean; parentIndex: number | null })[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const asset = await prisma.asset.findUnique({
      where: { id: item.assetId },
      include: { components: { where: { isRequired: true } } },
    });
    if (!asset) throw new Error(`Activo ${item.assetId} no encontrado`);

    const unitPrice = item.overridePrice ?? Number(asset.dailyRate);
    expanded.push({ ...item, unitPrice, isAutoBlocked: false, parentIndex: null });

    for (const comp of asset.components) {
      // Si el componente BOM tiene overridePrice (tier de hora/capacidad), usarlo como precio
      const compUnitPrice = comp.overridePrice != null ? Number(comp.overridePrice) : 0;
      expanded.push({
        assetId:      comp.childAssetId,
        quantity:     comp.quantity * item.quantity,
        overridePrice: compUnitPrice > 0 ? compUnitPrice : undefined,
        unitPrice:    compUnitPrice,
        isAutoBlocked: true,
        parentIndex:  i,
      });
    }
  }
  return expanded;
}

/**
 * Lee la configuración de ventana de pago (en horas) desde system_settings.
 * Default: 48 horas.
 */
export async function getHoldHours(): Promise<number> {
  const setting = await prisma.systemSetting.findUnique({ where: { key: "payment_hold_hours" } });
  return setting ? Number(setting.value) : 48;
}

/**
 * Verifica disponibilidad para todos los ítems del input.
 * Lanza un error descriptivo si algún activo no tiene stock suficiente.
 */
export async function assertAvailability(items: BookingItemInput[], startAt: Date, endAt: Date) {
  const availability = await getAvailability(startAt, endAt);
  const availMap = new Map(availability.map((a) => [a.assetId, a]));

  for (const item of items) {
    const avail = availMap.get(item.assetId);
    if (!avail) throw new Error(`Activo ${item.assetId} no encontrado o no rentable`);
    if (avail.availableUnits < item.quantity) {
      throw new Error(
        `Stock insuficiente para '${avail.assetName}': disponible ${avail.availableUnits}, solicitado ${item.quantity}`
      );
    }
  }
}
