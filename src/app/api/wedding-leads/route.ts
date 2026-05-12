import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 5, 10 * 60 * 1000); // 5 por 10 min por IP
  if (limited) return limited;

  const body = await req.json() as {
    name?: string; email?: string; phone?: string; eventType?: string;
    eventDate?: string; guestCount?: number; budget?: string; message?: string;
  };

  const { name, email, phone, eventType, eventDate, guestCount, budget, message } = body;

  if (!name?.trim() || !email?.trim() || !phone?.trim() || !eventType?.trim()) {
    return err("Nombre, email, teléfono y tipo de evento son requeridos", 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return err("Email inválido", 400);
  }

  const lead = await prisma.weddingLead.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      eventType: eventType.trim(),
      eventDate: eventDate ? new Date(eventDate) : null,
      guestCount: guestCount ?? null,
      budget: budget?.trim() ?? null,
      message: message?.trim() ?? null,
    },
  });

  return ok({ id: lead.id }, 201);
}
