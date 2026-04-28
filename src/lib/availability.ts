import { prisma } from "@/lib/prisma";

// Estados que consumen stock real
const STOCK_BLOCKING_STATUSES = ["pending_payment", "confirmed", "in_progress"] as const;

export interface AssetAvailability {
  assetId: number;
  assetName: string;
  totalUnits: number;
  reservedUnits: number;
  blockedUnits: number;
  availableUnits: number;
  isAvailable: boolean;
}

/**
 * Calcula la disponibilidad de uno o todos los activos rentables para un rango
 * de fechas dado. Considera:
 *  - booking_items con status en STOCK_BLOCKING_STATUSES y expires_at > now (para pending_payment)
 *  - availability_blocks que se solapan con el rango
 */
export async function getAvailability(
  startAt: Date,
  endAt: Date,
  assetId?: number
): Promise<AssetAvailability[]> {
  const assets = await prisma.asset.findMany({
    where: {
      isActive: true,
      isRentable: true,
      ...(assetId ? { id: assetId } : {}),
    },
    include: {
      bookingItems: {
        where: {
          booking: {
            OR: [
              // confirmed / in_progress: siempre bloquean
              { status: { in: ["confirmed", "in_progress"] } },
              // pending_payment: bloquea solo mientras no haya expirado
              { status: "pending_payment", expiresAt: { gt: new Date() } },
            ],
            // El rango de la reserva se solapa con el rango consultado
            AND: [
              { setupAt: { lt: endAt } },
              { teardownAt: { gt: startAt } },
            ],
          },
        },
      },
      availabilityBlocks: {
        where: {
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
      },
    },
  });

  return assets.map((asset) => {
    const reservedUnits = asset.bookingItems.reduce((sum, item) => sum + item.quantity, 0);
    // Cada bloqueo manual ocupa 1 unidad de "capacidad operativa" del activo
    const blockedUnits = asset.availabilityBlocks.length > 0 ? asset.totalUnits : 0;
    const availableUnits = Math.max(0, asset.totalUnits - reservedUnits - blockedUnits);

    return {
      assetId: asset.id,
      assetName: asset.name,
      totalUnits: asset.totalUnits,
      reservedUnits,
      blockedUnits,
      availableUnits,
      isAvailable: availableUnits > 0,
    };
  });
}
