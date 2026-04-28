import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/api";

// GET /api/clients/upcoming — clientes con fechas especiales en los próximos 60 días
export async function GET() {
  const today = new Date();
  const results: {
    clientId: number; clientName: string; phone: string | null; email: string;
    label: string; month: number; day: number; year: number | null;
    daysUntil: number; age: number | null;
  }[] = [];

  const allDates = await prisma.clientSpecialDate.findMany({
    include: { client: { select: { id: true, fullName: true, phone: true, email: true } } },
  });

  for (const d of allDates) {
    // Calcular la próxima ocurrencia de la fecha (este año o el siguiente)
    let next = new Date(today.getFullYear(), d.month - 1, d.day);
    if (next < today) next = new Date(today.getFullYear() + 1, d.month - 1, d.day);

    const daysUntil = Math.ceil((next.getTime() - today.getTime()) / 86_400_000);
    if (daysUntil > 60) continue;

    const age = d.year ? next.getFullYear() - d.year : null;

    results.push({
      clientId:   d.client.id,
      clientName: d.client.fullName,
      phone:      d.client.phone,
      email:      d.client.email,
      label:      d.label,
      month:      d.month,
      day:        d.day,
      year:       d.year,
      daysUntil,
      age,
    });
  }

  results.sort((a, b) => a.daysUntil - b.daysUntil);
  return ok(results);
}
