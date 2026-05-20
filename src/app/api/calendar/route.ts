import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

function toICalDate(date: Date): string {
  return date.toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
}

function esc(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return new NextResponse("No autenticado", { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ["confirmed", "in_progress", "pending_payment"] },
    },
    include: {
      client: { select: { fullName: true } },
      items: {
        where: { isAutoBlocked: false },
        include: { asset: { select: { name: true } } },
      },
    },
    orderBy: { setupAt: "asc" },
  });

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EventMaster Pro//Aura Producciones//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Aura Producciones — Reservas",
    "X-WR-TIMEZONE:America/Mexico_City",
    "X-WR-CALDESC:Reservas activas de Aura Producciones",
  ];

  for (const booking of bookings) {
    const assetNames = booking.items.map((i) => i.asset.name).join(", ");
    const summary = `${booking.eventName} — ${booking.client.fullName}`;
    const descParts = [
      assetNames ? `Equipo: ${assetNames}` : null,
      booking.venueAddress ? `Venue: ${booking.venueAddress}` : null,
      `Total: $${booking.totalAmount}`,
      `Estado: ${booking.status}`,
    ].filter(Boolean) as string[];

    const icalStatus =
      booking.status === "pending_payment" ? "TENTATIVE" : "CONFIRMED";

    lines.push(
      "BEGIN:VEVENT",
      `UID:${booking.id}@eventmaster-aura`,
      `DTSTAMP:${toICalDate(new Date())}`,
      `DTSTART:${toICalDate(booking.setupAt)}`,
      `DTEND:${toICalDate(booking.teardownAt)}`,
      `SUMMARY:${esc(summary)}`,
      `DESCRIPTION:${esc(descParts.join("\\n"))}`,
      booking.venueAddress ? `LOCATION:${esc(booking.venueAddress)}` : "LOCATION:",
      `STATUS:${icalStatus}`,
      `LAST-MODIFIED:${toICalDate(booking.updatedAt)}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  return new NextResponse(lines.join("\r\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="aura-reservas.ics"',
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
