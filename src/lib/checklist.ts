import { prisma } from "@/lib/prisma";
import { ChecklistPhase } from "@/generated/prisma";

// Tareas estándar de logística (no dependen del equipo reservado)
const TAREAS_SALIDA = [
  "Confirmar dirección y horario con el cliente",
  "Revisar que el vehículo tenga combustible",
  "Llevar extensiones y regletas de corriente",
  "Herramientas básicas (desarmadores, cinta, bridas)",
  "Verificar pronóstico del tiempo",
];

const TAREAS_ENTRADA = [
  "Contar y verificar todo el equipo devuelto",
  "Revisar estado de cables y conectores",
  "Limpiar equipo antes de guardar",
  "Registrar incidencias o daños",
  "Actualizar inventario si hay faltantes",
];

/**
 * Crea (o retorna existente) el checklist de una fase para una reserva.
 * Auto-genera los ítems a partir de los booking_items (equipo BOM + tareas estándar).
 */
export async function getOrCreateChecklist(bookingId: string, phase: ChecklistPhase) {
  const existing = await prisma.eventChecklist.findUnique({
    where: { bookingId_phase: { bookingId, phase } },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (existing) return existing;

  // Obtener los ítems del booking (incluyendo BOM auto-bloqueados)
  const bookingItems = await prisma.bookingItem.findMany({
    where: { bookingId },
    include: { asset: { select: { name: true } } },
    orderBy: { id: "asc" },
  });

  // Construir ítems de equipo
  const equipoItems = bookingItems.map((item, idx) => ({
    label: item.asset.name + (item.quantity > 1 ? ` ×${item.quantity}` : ""),
    category: "equipo",
    sortOrder: idx,
  }));

  // Tareas estándar según la fase
  const tareas = (phase === "salida" ? TAREAS_SALIDA : TAREAS_ENTRADA).map((t, idx) => ({
    label: t,
    category: "tarea",
    sortOrder: equipoItems.length + idx,
  }));

  const checklist = await prisma.eventChecklist.create({
    data: {
      bookingId,
      phase,
      items: { create: [...equipoItems, ...tareas] },
    },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  return checklist;
}
