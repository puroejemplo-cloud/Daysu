# Wedding Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar sección pública `/wedding-planner` para vender el servicio de planeación integral de eventos, con captura de leads y panel de gestión en el admin.

**Architecture:** Página pública estática (revalidate 300s) con hero animado, galería de fotos y formulario de contacto. Los leads se guardan en tabla `wedding_leads`. El admin gestiona leads y configura el contenido desde `/admin/wedding-planner`. La configuración se almacena en `system_settings` con prefijo `wp_`.

**Tech Stack:** Next.js 16 App Router, Prisma 7, TypeScript, Tailwind CSS 4, lucide-react.

---

## File Map

**Crear:**
- `src/app/api/wedding-leads/route.ts` — POST público (recibe formulario)
- `src/app/api/admin/wedding-leads/route.ts` — GET admin (lista leads)
- `src/app/api/admin/wedding-leads/[id]/route.ts` — GET+PATCH admin (detalle/edición)
- `src/app/api/admin/wedding-leads/[id]/convert/route.ts` — POST admin (lead → cliente)
- `src/app/api/admin/wedding-planner/settings/route.ts` — GET+PATCH admin (configuración wp_*)
- `src/app/wedding-planner/page.tsx` — página pública (server component)
- `src/app/admin/wedding-planner/page.tsx` — página admin (client)
- `src/components/wedding/WeddingHero.tsx` — hero con texto animado
- `src/components/wedding/WeddingGallery.tsx` — grid de fotos
- `src/components/wedding/WeddingSteps.tsx` — 3 pasos
- `src/components/wedding/WeddingTestimonials.tsx` — reseñas
- `src/components/wedding/WeddingForm.tsx` — formulario de contacto
- `src/components/admin/wedding/WeddingLeadsTable.tsx` — tabla de leads
- `src/components/admin/wedding/WeddingLeadDrawer.tsx` — drawer detalle/edición
- `src/components/admin/wedding/WeddingPlannerConfig.tsx` — configuración del contenido

**Modificar:**
- `prisma/schema.prisma` — agregar `WeddingLead`, `WeddingLeadStatus`, relación inversa en `Client`
- `src/components/admin/AdminSidebar.tsx` — agregar enlace Wedding Planner en NAV_PRIMARY

---

## Task 1: DB — WeddingLead schema + migración

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Agregar enum y modelo al schema**

Al final de `prisma/schema.prisma`, antes del último comentario, agregar:

```prisma
// ─── MÓDULO 5: WEDDING PLANNER — LEADS ───────────────────────────────────────

enum WeddingLeadStatus {
  new
  contacted
  negotiating
  confirmed
  discarded
}

model WeddingLead {
  id         Int               @id @default(autoincrement())
  name       String            @db.VarChar(200)
  email      String            @db.VarChar(200)
  phone      String?           @db.VarChar(30)
  eventType  String            @map("event_type") @db.VarChar(100)
  eventDate  DateTime?         @map("event_date") @db.Date
  guestCount Int?              @map("guest_count")
  budget     String?           @db.VarChar(100)
  message    String?           @db.Text
  status     WeddingLeadStatus @default(new)
  adminNotes String?           @map("admin_notes") @db.Text
  clientId   Int?              @map("client_id")
  createdAt  DateTime          @default(now()) @map("created_at")
  updatedAt  DateTime          @updatedAt @map("updated_at")

  client Client? @relation(fields: [clientId], references: [id])

  @@map("wedding_leads")
}
```

En el modelo `Client` (alrededor de línea 176), agregar la relación inversa después de `specialDates ClientSpecialDate[]`:

```prisma
  weddingLeads WeddingLead[]
```

- [ ] **Step 2: Crear y aplicar migración**

```bash
npm run db:migrate
```

Cuando pregunte el nombre: `add_wedding_leads`

- [ ] **Step 3: Regenerar cliente Prisma**

```bash
npm run db:generate
```

- [ ] **Step 4: Verificar types**

```bash
npx tsc --noEmit
```

Expected: 0 errores.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add WeddingLead model and migration"
```

---

## Task 2: API pública — POST /api/wedding-leads

**Files:**
- Create: `src/app/api/wedding-leads/route.ts`

- [ ] **Step 1: Crear el endpoint**

```ts
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
```

- [ ] **Step 2: Verificar types**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/wedding-leads/
git commit -m "feat: POST /api/wedding-leads — public contact form endpoint"
```

---

## Task 3: API admin — CRUD wedding leads

**Files:**
- Create: `src/app/api/admin/wedding-leads/route.ts`
- Create: `src/app/api/admin/wedding-leads/[id]/route.ts`
- Create: `src/app/api/admin/wedding-leads/[id]/convert/route.ts`

- [ ] **Step 1: Crear GET /api/admin/wedding-leads**

```ts
// src/app/api/admin/wedding-leads/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";
import { WeddingLeadStatus } from "@/generated/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return err("No autorizado", 401);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as WeddingLeadStatus | null;

  const leads = await prisma.weddingLead.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, fullName: true } },
    },
  });

  return ok(leads);
}
```

- [ ] **Step 2: Crear GET+PATCH /api/admin/wedding-leads/[id]**

```ts
// src/app/api/admin/wedding-leads/[id]/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";
import { WeddingLeadStatus } from "@/generated/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return err("No autorizado", 401);

  const { id } = await params;
  const lead = await prisma.weddingLead.findUnique({
    where: { id: Number(id) },
    include: { client: { select: { id: true, fullName: true } } },
  });
  if (!lead) return err("No encontrado", 404);
  return ok(lead);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return err("No autorizado", 401);

  const { id } = await params;
  const body = await req.json() as {
    status?: WeddingLeadStatus;
    adminNotes?: string;
    clientId?: number | null;
  };

  const lead = await prisma.weddingLead.update({
    where: { id: Number(id) },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.adminNotes !== undefined && { adminNotes: body.adminNotes }),
      ...(body.clientId !== undefined && { clientId: body.clientId }),
    },
  });

  return ok(lead);
}
```

- [ ] **Step 3: Crear POST /api/admin/wedding-leads/[id]/convert**

Convierte un lead en un `Client` del CRM y vincula el `clientId` al lead.

```ts
// src/app/api/admin/wedding-leads/[id]/convert/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return err("No autorizado", 401);

  const { id } = await params;
  const lead = await prisma.weddingLead.findUnique({ where: { id: Number(id) } });
  if (!lead) return err("Lead no encontrado", 404);
  if (lead.clientId) return err("Este lead ya tiene un cliente vinculado", 400);

  // Verificar si ya existe un cliente con ese email
  const existing = await prisma.client.findUnique({ where: { email: lead.email } });

  const client = existing ?? await prisma.client.create({
    data: {
      fullName: lead.name,
      email: lead.email,
      phone: lead.phone ?? undefined,
      crmNotes: `Lead Wedding Planner — ${lead.eventType}${lead.eventDate ? ` · ${lead.eventDate.toISOString().slice(0, 10)}` : ""}`,
    },
  });

  const updated = await prisma.weddingLead.update({
    where: { id: Number(id) },
    data: { clientId: client.id, status: "contacted" },
  });

  return ok({ lead: updated, client });
}
```

- [ ] **Step 4: Verificar types**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/wedding-leads/
git commit -m "feat: admin CRUD API for wedding leads"
```

---

## Task 4: API admin — configuración Wedding Planner

**Files:**
- Create: `src/app/api/admin/wedding-planner/settings/route.ts`

- [ ] **Step 1: Crear el endpoint de configuración**

Lee y escribe las claves `wp_*` en `system_settings`. Devuelve un objeto con todas las claves parseadas.

```ts
// src/app/api/admin/wedding-planner/settings/route.ts
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
```

- [ ] **Step 2: Verificar types**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/wedding-planner/
git commit -m "feat: wedding planner settings API (wp_* keys)"
```

---

## Task 5: Componente WeddingHero

**Files:**
- Create: `src/components/wedding/WeddingHero.tsx`

- [ ] **Step 1: Crear el componente con animación fade**

```tsx
// src/components/wedding/WeddingHero.tsx
"use client";

import { useState, useEffect } from "react";

interface WeddingHeroProps {
  eventTypes: string[];
  subtitle: string;
}

export function WeddingHero({ eventTypes, subtitle }: WeddingHeroProps) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (eventTypes.length <= 1) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % eventTypes.length);
        setVisible(true);
      }, 400);
    }, 2500);
    return () => clearInterval(interval);
  }, [eventTypes.length]);

  return (
    <section
      className="relative flex items-center justify-center overflow-hidden"
      style={{ minHeight: "100svh" }}
    >
      {/* Fondo — reemplazar /wedding/hero.jpg con foto real */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/wedding/hero.jpg')" }}
      />
      <div className="absolute inset-0" style={{ background: "rgba(5,5,26,0.65)" }} />

      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        <p
          className="text-lg md:text-2xl mb-1"
          style={{ color: "var(--cream)", fontWeight: 300, letterSpacing: "0.05em" }}
        >
          Planificamos tu
        </p>

        <h1
          className="text-5xl md:text-7xl font-bold mb-2"
          style={{
            color: "var(--gold)",
            transition: "opacity 0.4s ease",
            opacity: visible ? 1 : 0,
            minHeight: "1.2em",
          }}
        >
          {eventTypes[index] ?? "Boda"}
        </h1>

        <p
          className="text-lg md:text-2xl mb-6"
          style={{ color: "var(--cream)", fontWeight: 300 }}
        >
          desde cero. Tú solo disfruta.
        </p>

        {subtitle && (
          <p className="text-base mb-10 max-w-xl mx-auto" style={{ color: "var(--muted)" }}>
            {subtitle}
          </p>
        )}

        <a
          href="#contacto"
          className="btn-gold inline-block px-8 py-4 text-base rounded-full"
          style={{ textDecoration: "none" }}
        >
          Quiero planificar mi evento
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verificar types**

```bash
npx tsc --noEmit
```

---

## Task 6: Componentes WeddingGallery, WeddingSteps y WeddingTestimonials

**Files:**
- Create: `src/components/wedding/WeddingGallery.tsx`
- Create: `src/components/wedding/WeddingSteps.tsx`
- Create: `src/components/wedding/WeddingTestimonials.tsx`

- [ ] **Step 1: WeddingGallery — grid masonry de fotos**

```tsx
// src/components/wedding/WeddingGallery.tsx
interface WeddingGalleryProps {
  images: string[]; // URLs completas (Vercel Blob processed)
}

export function WeddingGallery({ images }: WeddingGalleryProps) {
  if (!images.length) return null;

  return (
    <section className="py-16 px-4" style={{ background: "var(--black)" }}>
      <div className="max-w-6xl mx-auto">
        <h2
          className="text-center text-3xl font-semibold mb-10"
          style={{ color: "var(--cream)" }}
        >
          Eventos que hemos creado
        </h2>

        <div
          style={{
            columns: "2 280px",
            gap: "0.75rem",
          }}
        >
          {images.map((url, i) => (
            <div
              key={i}
              style={{
                breakInside: "avoid",
                marginBottom: "0.75rem",
                borderRadius: "0.5rem",
                overflow: "hidden",
              }}
            >
              <img
                src={url}
                alt={`Evento ${i + 1}`}
                style={{ width: "100%", display: "block", objectFit: "cover" }}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: WeddingSteps**

```tsx
// src/components/wedding/WeddingSteps.tsx
interface Step {
  title: string;
  desc: string;
}

interface WeddingStepsProps {
  steps: Step[];
}

export function WeddingSteps({ steps }: WeddingStepsProps) {
  return (
    <section className="py-16 px-4" style={{ background: "#0a0a1a" }}>
      <div className="max-w-4xl mx-auto">
        <h2
          className="text-center text-3xl font-semibold mb-12"
          style={{ color: "var(--cream)" }}
        >
          ¿Cómo funciona?
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold"
                style={{ background: "var(--gold)", color: "#05051a" }}
              >
                {i + 1}
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--cream)" }}>
                {step.title}
              </h3>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: WeddingTestimonials**

```tsx
// src/components/wedding/WeddingTestimonials.tsx
interface Testimonial {
  name: string;
  eventType: string;
  text: string;
}

interface WeddingTestimonialsProps {
  testimonials: Testimonial[];
}

export function WeddingTestimonials({ testimonials }: WeddingTestimonialsProps) {
  if (!testimonials.length) return null;

  return (
    <section className="py-16 px-4" style={{ background: "var(--black)" }}>
      <div className="max-w-4xl mx-auto">
        <h2
          className="text-center text-3xl font-semibold mb-10"
          style={{ color: "var(--cream)" }}
        >
          Lo que dicen nuestros clientes
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="aura-card p-6 rounded-xl"
            >
              <p
                className="text-base mb-4 italic"
                style={{ color: "var(--cream)", lineHeight: 1.7 }}
              >
                "{t.text}"
              </p>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--gold)" }}>
                  {t.name}
                </p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {t.eventType}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Verificar types**

```bash
npx tsc --noEmit
```

---

## Task 7: Componente WeddingForm

**Files:**
- Create: `src/components/wedding/WeddingForm.tsx`

- [ ] **Step 1: Crear formulario controlado con validación inline**

```tsx
// src/components/wedding/WeddingForm.tsx
"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

const EVENT_TYPES = ["Boda", "XV Años", "Fiesta", "Evento Corporativo", "Graduación", "Otro"];

interface FormState {
  name: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  guestCount: string;
  budget: string;
  message: string;
}

type Field = keyof FormState;

const INITIAL: FormState = {
  name: "", email: "", phone: "", eventType: "",
  eventDate: "", guestCount: "", budget: "", message: "",
};

function validate(form: FormState): Partial<Record<Field, string>> {
  return {
    name: !form.name.trim() ? "Nombre requerido" : "",
    email: !form.email.trim()
      ? "Email requerido"
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
      ? "Email inválido"
      : "",
    phone: !form.phone.trim() ? "Teléfono requerido" : "",
    eventType: !form.eventType ? "Selecciona un tipo de evento" : "",
  };
}

export function WeddingForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const errors = validate(form);
  const isValid = Object.values(errors).every((e) => !e);

  function set(field: Field, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function touch(field: Field) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true, eventType: true });
    if (!isValid) return;
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch("/api/wedding-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          guestCount: form.guestCount ? parseInt(form.guestCount, 10) : undefined,
          eventDate: form.eventDate || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Error al enviar");
      }
      setSubmitted(true);
    } catch (e) {
      setServerError(
        e instanceof Error ? e.message : "Ocurrió un error. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-16">
        <p className="text-3xl font-semibold mb-3" style={{ color: "var(--gold)" }}>
          ¡Solicitud recibida!
        </p>
        <p style={{ color: "var(--cream)" }}>
          Te contactaremos pronto para comenzar a planificar tu evento.
        </p>
      </div>
    );
  }

  return (
    <section id="contacto" className="py-16 px-4" style={{ background: "#0a0a1a" }}>
      <div className="max-w-2xl mx-auto">
        <h2
          className="text-center text-3xl font-semibold mb-2"
          style={{ color: "var(--cream)" }}
        >
          Comencemos a planificar
        </h2>
        <p className="text-center text-sm mb-10" style={{ color: "var(--muted)" }}>
          Cuéntanos sobre tu evento y te contactamos en menos de 24 horas.
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Nombre */}
          <div>
            <label htmlFor="wp-name" className="block text-sm mb-1" style={{ color: "var(--cream)" }}>
              Nombre completo *
            </label>
            <input
              id="wp-name"
              className="aura-input w-full"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              onBlur={() => touch("name")}
              placeholder="Tu nombre"
            />
            {touched.name && errors.name && (
              <p className="text-xs mt-1" style={{ color: "var(--red)" }}>{errors.name}</p>
            )}
          </div>

          {/* Email + Tel */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="wp-email" className="block text-sm mb-1" style={{ color: "var(--cream)" }}>
                Email *
              </label>
              <input
                id="wp-email"
                type="email"
                className="aura-input w-full"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                onBlur={() => touch("email")}
                placeholder="tu@email.com"
              />
              {touched.email && errors.email && (
                <p className="text-xs mt-1" style={{ color: "var(--red)" }}>{errors.email}</p>
              )}
            </div>
            <div>
              <label htmlFor="wp-phone" className="block text-sm mb-1" style={{ color: "var(--cream)" }}>
                Teléfono *
              </label>
              <input
                id="wp-phone"
                type="tel"
                className="aura-input w-full"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                onBlur={() => touch("phone")}
                placeholder="+52 492 000 0000"
              />
              {touched.phone && errors.phone && (
                <p className="text-xs mt-1" style={{ color: "var(--red)" }}>{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Tipo de evento */}
          <div>
            <label htmlFor="wp-event-type" className="block text-sm mb-1" style={{ color: "var(--cream)" }}>
              Tipo de evento *
            </label>
            <select
              id="wp-event-type"
              className="aura-input w-full"
              value={form.eventType}
              onChange={(e) => set("eventType", e.target.value)}
              onBlur={() => touch("eventType")}
            >
              <option value="">Selecciona...</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {touched.eventType && errors.eventType && (
              <p className="text-xs mt-1" style={{ color: "var(--red)" }}>{errors.eventType}</p>
            )}
          </div>

          {/* Fecha + Invitados */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="wp-date" className="block text-sm mb-1" style={{ color: "var(--cream)" }}>
                Fecha estimada
              </label>
              <input
                id="wp-date"
                type="date"
                className="aura-input w-full"
                value={form.eventDate}
                onChange={(e) => set("eventDate", e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div>
              <label htmlFor="wp-guests" className="block text-sm mb-1" style={{ color: "var(--cream)" }}>
                Número de invitados
              </label>
              <input
                id="wp-guests"
                type="number"
                min="1"
                className="aura-input w-full"
                value={form.guestCount}
                onChange={(e) => set("guestCount", e.target.value)}
                placeholder="Aprox."
              />
            </div>
          </div>

          {/* Presupuesto */}
          <div>
            <label htmlFor="wp-budget" className="block text-sm mb-1" style={{ color: "var(--cream)" }}>
              Presupuesto aproximado
            </label>
            <input
              id="wp-budget"
              className="aura-input w-full"
              value={form.budget}
              onChange={(e) => set("budget", e.target.value)}
              placeholder="Ej: $50,000 – $80,000"
            />
          </div>

          {/* Mensaje */}
          <div>
            <label htmlFor="wp-message" className="block text-sm mb-1" style={{ color: "var(--cream)" }}>
              Cuéntanos más
            </label>
            <textarea
              id="wp-message"
              className="aura-input w-full"
              rows={4}
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              placeholder="Comparte detalles, ideas o dudas sobre tu evento..."
              style={{ resize: "vertical" }}
            />
          </div>

          {serverError && (
            <p className="text-sm" style={{ color: "var(--red)" }}>{serverError}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full py-4 text-base rounded-full"
            aria-busy={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" /> Enviando...
              </span>
            ) : (
              "Enviar solicitud"
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verificar types**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit (Tasks 5-7)**

```bash
git add src/components/wedding/
git commit -m "feat: wedding planner public components (hero, gallery, steps, testimonials, form)"
```

---

## Task 8: Página pública /wedding-planner

**Files:**
- Create: `src/app/wedding-planner/page.tsx`
- Create: `public/wedding/hero.jpg` ← **El admin debe colocar aquí una foto del evento**

- [ ] **Step 1: Crear placeholder de imagen**

Copiar cualquier foto de evento en `public/wedding/hero.jpg`. Es la foto de fondo del hero.

- [ ] **Step 2: Crear la página server component**

```tsx
// src/app/wedding-planner/page.tsx
import { prisma } from "@/lib/prisma";
import { WeddingHero } from "@/components/wedding/WeddingHero";
import { WeddingGallery } from "@/components/wedding/WeddingGallery";
import { WeddingSteps } from "@/components/wedding/WeddingSteps";
import { WeddingTestimonials } from "@/components/wedding/WeddingTestimonials";
import { WeddingForm } from "@/components/wedding/WeddingForm";

export const revalidate = 300; // 5 minutos

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
    steps: map.wp_steps
      ? (JSON.parse(map.wp_steps) as typeof DEFAULTS.steps)
      : DEFAULTS.steps,
  };
}

export default async function WeddingPlannerPage() {
  const settings = await getWpSettings();

  return (
    <main>
      <WeddingHero eventTypes={settings.eventTypes} subtitle={settings.heroSubtitle} />
      <WeddingGallery images={settings.galleryImages} />
      <WeddingSteps steps={settings.steps} />
      <WeddingTestimonials testimonials={settings.testimonials} />
      <WeddingForm />
    </main>
  );
}
```

- [ ] **Step 3: Verificar types + build check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Abrir en el navegador**

```bash
npm run dev
```

Navegar a `http://localhost:3000/wedding-planner` y verificar:
- Hero visible con texto animado ciclando
- Sección de pasos visible
- Formulario accesible al hacer clic en CTA o scroll
- Formulario de envío funciona (crear un lead de prueba)

- [ ] **Step 5: Commit**

```bash
git add src/app/wedding-planner/ public/wedding/
git commit -m "feat: /wedding-planner public page"
```

---

## Task 9: Admin — tabla y drawer de leads

**Files:**
- Create: `src/components/admin/wedding/WeddingLeadsTable.tsx`
- Create: `src/components/admin/wedding/WeddingLeadDrawer.tsx`

- [ ] **Step 1: Crear tipos compartidos**

Agregar al inicio de `WeddingLeadsTable.tsx`:

```ts
export interface WeddingLeadRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  eventType: string;
  eventDate: string | null;
  guestCount: number | null;
  budget: string | null;
  message: string | null;
  status: "new" | "contacted" | "negotiating" | "confirmed" | "discarded";
  adminNotes: string | null;
  clientId: number | null;
  createdAt: string;
  client: { id: number; fullName: string } | null;
}
```

- [ ] **Step 2: Crear WeddingLeadsTable**

```tsx
// src/components/admin/wedding/WeddingLeadsTable.tsx
"use client";
import { useState } from "react";
import { WeddingLeadDrawer } from "./WeddingLeadDrawer";

export interface WeddingLeadRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  eventType: string;
  eventDate: string | null;
  guestCount: number | null;
  budget: string | null;
  message: string | null;
  status: "new" | "contacted" | "negotiating" | "confirmed" | "discarded";
  adminNotes: string | null;
  clientId: number | null;
  createdAt: string;
  client: { id: number; fullName: string } | null;
}

const STATUS_LABELS: Record<WeddingLeadRow["status"], string> = {
  new: "Nuevo",
  contacted: "Contactado",
  negotiating: "En negociación",
  confirmed: "Confirmado",
  discarded: "Descartado",
};

const STATUS_COLORS: Record<WeddingLeadRow["status"], string> = {
  new: "#E8198A",
  contacted: "#3b82f6",
  negotiating: "#f59e0b",
  confirmed: "#22c55e",
  discarded: "#6b7280",
};

interface Props {
  leads: WeddingLeadRow[];
  onUpdate: (updated: WeddingLeadRow) => void;
}

export function WeddingLeadsTable({ leads, onUpdate }: Props) {
  const [selected, setSelected] = useState<WeddingLeadRow | null>(null);
  const [filterStatus, setFilterStatus] = useState<WeddingLeadRow["status"] | "all">("all");

  const filtered = filterStatus === "all" ? leads : leads.filter((l) => l.status === filterStatus);

  return (
    <div>
      {/* Filtros de estado */}
      <div className="flex gap-2 flex-wrap mb-4">
        {(["all", "new", "contacted", "negotiating", "confirmed", "discarded"] as const).map(
          (s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="admin-badge"
              style={{
                cursor: "pointer",
                opacity: filterStatus === s ? 1 : 0.45,
                background: s === "all" ? "rgba(255,255,255,0.08)" : `${STATUS_COLORS[s] ?? "#888"}22`,
                color: s === "all" ? "var(--cream)" : STATUS_COLORS[s] ?? "#888",
                border: `1px solid ${s === "all" ? "rgba(255,255,255,0.1)" : STATUS_COLORS[s] ?? "#888"}44`,
              }}
            >
              {s === "all" ? "Todos" : STATUS_LABELS[s]}
            </button>
          )
        )}
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: "var(--muted)" }} className="text-sm py-8 text-center">
          No hay leads con este filtro.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                {["Nombre", "Evento", "Fecha evento", "Invitados", "Estado", "Recibido"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left", padding: "0.5rem 0.75rem",
                        fontSize: "0.75rem", color: "var(--muted)", fontWeight: 500,
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => setSelected(lead)}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.03)")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "0.75rem", color: "var(--cream)", fontSize: "0.875rem" }}>
                    <p className="font-medium">{lead.name}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{lead.email}</p>
                  </td>
                  <td style={{ padding: "0.75rem", color: "var(--cream)", fontSize: "0.875rem" }}>
                    {lead.eventType}
                  </td>
                  <td style={{ padding: "0.75rem", color: "var(--muted)", fontSize: "0.875rem" }}>
                    {lead.eventDate ? new Date(lead.eventDate).toLocaleDateString("es-MX") : "—"}
                  </td>
                  <td style={{ padding: "0.75rem", color: "var(--muted)", fontSize: "0.875rem" }}>
                    {lead.guestCount ?? "—"}
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <span
                      className="admin-badge"
                      style={{
                        background: `${STATUS_COLORS[lead.status]}22`,
                        color: STATUS_COLORS[lead.status],
                        border: `1px solid ${STATUS_COLORS[lead.status]}44`,
                      }}
                    >
                      {STATUS_LABELS[lead.status]}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem", color: "var(--muted)", fontSize: "0.75rem" }}>
                    {new Date(lead.createdAt).toLocaleDateString("es-MX")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <WeddingLeadDrawer
          lead={selected}
          onClose={() => setSelected(null)}
          onUpdate={(updated) => {
            onUpdate(updated);
            setSelected(updated);
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Crear WeddingLeadDrawer**

```tsx
// src/components/admin/wedding/WeddingLeadDrawer.tsx
"use client";
import { useState } from "react";
import { X, Loader2, UserPlus } from "lucide-react";
import type { WeddingLeadRow } from "./WeddingLeadsTable";

const STATUS_OPTIONS = [
  { value: "new", label: "Nuevo" },
  { value: "contacted", label: "Contactado" },
  { value: "negotiating", label: "En negociación" },
  { value: "confirmed", label: "Confirmado" },
  { value: "discarded", label: "Descartado" },
] as const;

interface Props {
  lead: WeddingLeadRow;
  onClose: () => void;
  onUpdate: (updated: WeddingLeadRow) => void;
}

export function WeddingLeadDrawer({ lead, onClose, onUpdate }: Props) {
  const [status, setStatus] = useState(lead.status);
  const [notes, setNotes] = useState(lead.adminNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/wedding-leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes: notes }),
      });
      const data = await res.json() as { data: WeddingLeadRow };
      onUpdate({ ...lead, ...data.data });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleConvert() {
    if (!confirm(`¿Crear cliente en CRM para ${lead.name}?`)) return;
    setConverting(true);
    try {
      const res = await fetch(`/api/admin/wedding-leads/${lead.id}/convert`, {
        method: "POST",
      });
      const data = await res.json() as { data: { lead: WeddingLeadRow } };
      onUpdate(data.data.lead);
      alert("Cliente creado en CRM correctamente.");
    } catch {
      alert("Error al crear el cliente.");
    } finally {
      setConverting(false);
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          zIndex: 50, backdropFilter: "blur(2px)",
        }}
      />
      {/* Drawer */}
      <div
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: "min(480px, 100vw)",
          background: "#09090b",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          zIndex: 51, overflowY: "auto", padding: "1.5rem",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-lg" style={{ color: "var(--cream)" }}>
              {lead.name}
            </h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {lead.eventType}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent", border: "none",
              color: "var(--muted)", cursor: "pointer",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Datos del lead */}
        <div className="admin-surface rounded-xl p-4 mb-4 space-y-2">
          {[
            ["Email", lead.email],
            ["Teléfono", lead.phone ?? "—"],
            ["Fecha evento", lead.eventDate ? new Date(lead.eventDate).toLocaleDateString("es-MX") : "—"],
            ["Invitados", lead.guestCount?.toString() ?? "—"],
            ["Presupuesto", lead.budget ?? "—"],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <span className="text-xs font-medium w-28 shrink-0" style={{ color: "var(--muted)" }}>
                {label}
              </span>
              <span className="text-sm" style={{ color: "var(--cream)" }}>{value}</span>
            </div>
          ))}
          {lead.message && (
            <div className="pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>Mensaje</p>
              <p className="text-sm" style={{ color: "var(--cream)", lineHeight: 1.6 }}>
                {lead.message}
              </p>
            </div>
          )}
        </div>

        {/* Estado */}
        <div className="mb-4">
          <label className="block text-sm mb-1" style={{ color: "var(--cream)" }}>Estado</label>
          <select
            className="aura-input w-full"
            value={status}
            onChange={(e) => setStatus(e.target.value as WeddingLeadRow["status"])}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Notas internas */}
        <div className="mb-6">
          <label className="block text-sm mb-1" style={{ color: "var(--cream)" }}>
            Notas internas
          </label>
          <textarea
            className="aura-input w-full"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas del seguimiento..."
            style={{ resize: "vertical" }}
          />
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-gold w-full py-3 text-sm rounded-lg"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={15} className="animate-spin" /> Guardando...
              </span>
            ) : saved ? "¡Guardado!" : "Guardar cambios"}
          </button>

          {!lead.clientId && (
            <button
              onClick={handleConvert}
              disabled={converting}
              className="btn-ghost w-full py-3 text-sm rounded-lg flex items-center justify-center gap-2"
            >
              {converting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <UserPlus size={15} />
              )}
              Crear cliente en CRM
            </button>
          )}

          {lead.clientId && (
            <a
              href={`/admin/clientes/${lead.clientId}`}
              className="btn-ghost w-full py-3 text-sm rounded-lg text-center"
              style={{ textDecoration: "none" }}
            >
              Ver perfil CRM →
            </a>
          )}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Verificar types**

```bash
npx tsc --noEmit
```

---

## Task 10: Admin — panel de configuración

**Files:**
- Create: `src/components/admin/wedding/WeddingPlannerConfig.tsx`

- [ ] **Step 1: Crear WeddingPlannerConfig**

```tsx
// src/components/admin/wedding/WeddingPlannerConfig.tsx
"use client";
import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface Testimonial { name: string; eventType: string; text: string }
interface Step { title: string; desc: string }

interface WpSettings {
  wp_event_types: string[];
  wp_gallery_images: string[];
  wp_testimonials: Testimonial[];
  wp_hero_subtitle: string;
  wp_steps: Step[];
}

interface Props { initial: WpSettings }

export function WeddingPlannerConfig({ initial }: Props) {
  const [settings, setSettings] = useState<WpSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Helpers
  function setField<K extends keyof WpSettings>(key: K, value: WpSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/admin/wedding-planner/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Hero subtitle */}
      <section>
        <h3 className="font-medium mb-2" style={{ color: "var(--cream)" }}>Subtítulo del hero</h3>
        <input
          className="aura-input w-full"
          value={settings.wp_hero_subtitle}
          onChange={(e) => setField("wp_hero_subtitle", e.target.value)}
        />
      </section>

      {/* Tipos de evento (texto animado) */}
      <section>
        <h3 className="font-medium mb-2" style={{ color: "var(--cream)" }}>
          Tipos de evento (texto animado)
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {settings.wp_event_types.map((t, i) => (
            <span
              key={i}
              className="admin-badge flex items-center gap-1"
              style={{ background: "rgba(232,25,138,0.12)", color: "var(--gold)", border: "1px solid rgba(232,25,138,0.25)" }}
            >
              {t}
              <button
                onClick={() =>
                  setField("wp_event_types", settings.wp_event_types.filter((_, j) => j !== i))
                }
                style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0 }}
              >
                <Trash2 size={11} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            id="wp-new-type"
            className="aura-input flex-1"
            placeholder="Nuevo tipo..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const val = (e.target as HTMLInputElement).value.trim();
                if (val && !settings.wp_event_types.includes(val)) {
                  setField("wp_event_types", [...settings.wp_event_types, val]);
                  (e.target as HTMLInputElement).value = "";
                }
              }
            }}
          />
          <button
            className="btn-ghost px-3 py-2 text-sm rounded-lg flex items-center gap-1"
            onClick={() => {
              const input = document.getElementById("wp-new-type") as HTMLInputElement;
              const val = input.value.trim();
              if (val && !settings.wp_event_types.includes(val)) {
                setField("wp_event_types", [...settings.wp_event_types, val]);
                input.value = "";
              }
            }}
          >
            <Plus size={14} /> Agregar
          </button>
        </div>
      </section>

      {/* Galería — URLs de Vercel Blob */}
      <section>
        <h3 className="font-medium mb-1" style={{ color: "var(--cream)" }}>
          Fotos de la galería
        </h3>
        <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
          Pega las URLs de las imágenes procesadas de Vercel Blob (una por línea).
        </p>
        <textarea
          className="aura-input w-full font-mono text-xs"
          rows={6}
          value={settings.wp_gallery_images.join("\n")}
          onChange={(e) =>
            setField(
              "wp_gallery_images",
              e.target.value.split("\n").map((s) => s.trim()).filter(Boolean)
            )
          }
          placeholder="https://abc.public.blob.vercel-storage.com/galeria/processed/foto.webp"
          style={{ resize: "vertical" }}
        />
      </section>

      {/* Testimonios */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium" style={{ color: "var(--cream)" }}>Testimonios</h3>
          <button
            className="btn-ghost px-3 py-1 text-xs rounded-lg flex items-center gap-1"
            onClick={() =>
              setField("wp_testimonials", [
                ...settings.wp_testimonials,
                { name: "", eventType: "", text: "" },
              ])
            }
          >
            <Plus size={13} /> Agregar
          </button>
        </div>
        <div className="space-y-4">
          {settings.wp_testimonials.map((t, i) => (
            <div key={i} className="admin-surface rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-start">
                <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                  Testimonio {i + 1}
                </p>
                <button
                  onClick={() =>
                    setField("wp_testimonials", settings.wp_testimonials.filter((_, j) => j !== i))
                  }
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--red)" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {(["name", "eventType", "text"] as const).map((field) => (
                <div key={field}>
                  <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>
                    {field === "name" ? "Nombre" : field === "eventType" ? "Tipo de evento" : "Texto"}
                  </label>
                  {field === "text" ? (
                    <textarea
                      className="aura-input w-full text-sm"
                      rows={3}
                      value={t[field]}
                      onChange={(e) => {
                        const updated = [...settings.wp_testimonials];
                        updated[i] = { ...updated[i], [field]: e.target.value };
                        setField("wp_testimonials", updated);
                      }}
                    />
                  ) : (
                    <input
                      className="aura-input w-full text-sm"
                      value={t[field]}
                      onChange={(e) => {
                        const updated = [...settings.wp_testimonials];
                        updated[i] = { ...updated[i], [field]: e.target.value };
                        setField("wp_testimonials", updated);
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Pasos */}
      <section>
        <h3 className="font-medium mb-3" style={{ color: "var(--cream)" }}>Pasos "¿Cómo funciona?"</h3>
        <div className="space-y-3">
          {settings.wp_steps.map((step, i) => (
            <div key={i} className="admin-surface rounded-xl p-4 space-y-2">
              <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>Paso {i + 1}</p>
              {(["title", "desc"] as const).map((field) => (
                <div key={field}>
                  <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>
                    {field === "title" ? "Título" : "Descripción"}
                  </label>
                  <input
                    className="aura-input w-full text-sm"
                    value={step[field]}
                    onChange={(e) => {
                      const updated = [...settings.wp_steps];
                      updated[i] = { ...updated[i], [field]: e.target.value };
                      setField("wp_steps", updated);
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Guardar */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-gold px-8 py-3 rounded-lg text-sm"
      >
        {saving ? (
          <span className="flex items-center gap-2">
            <Loader2 size={15} className="animate-spin" /> Guardando...
          </span>
        ) : saved ? "¡Guardado!" : "Guardar configuración"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verificar types**

```bash
npx tsc --noEmit
```

---

## Task 11: Página admin /admin/wedding-planner

**Files:**
- Create: `src/app/admin/wedding-planner/page.tsx`

- [ ] **Step 1: Crear la página admin**

```tsx
// src/app/admin/wedding-planner/page.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { WeddingLeadsTable, type WeddingLeadRow } from "@/components/admin/wedding/WeddingLeadsTable";
import { WeddingPlannerConfig } from "@/components/admin/wedding/WeddingPlannerConfig";

type Tab = "leads" | "config";

interface WpSettings {
  wp_event_types: string[];
  wp_gallery_images: string[];
  wp_testimonials: { name: string; eventType: string; text: string }[];
  wp_hero_subtitle: string;
  wp_steps: { title: string; desc: string }[];
}

export default function WeddingPlannerPage() {
  const [tab, setTab] = useState<Tab>("leads");
  const [leads, setLeads] = useState<WeddingLeadRow[]>([]);
  const [settings, setSettings] = useState<WpSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    const res = await fetch("/api/admin/wedding-leads");
    const data = await res.json() as { data: WeddingLeadRow[] };
    setLeads(data.data);
  }, []);

  const fetchSettings = useCallback(async () => {
    const res = await fetch("/api/admin/wedding-planner/settings");
    const data = await res.json() as { data: WpSettings };
    setSettings(data.data);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchLeads(), fetchSettings()]).finally(() => setLoading(false));
  }, [fetchLeads, fetchSettings]);

  function handleLeadUpdate(updated: WeddingLeadRow) {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <p className="admin-label">Marketing</p>
        <h1 className="admin-page-title">Wedding Planner</h1>
        <p className="admin-page-desc">
          Gestiona los leads del servicio de planeación y configura el contenido de la página pública.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 mb-8" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0" }}>
        {(["leads", "config"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: tab === t ? 500 : 400,
              color: tab === t ? "var(--gold)" : "var(--muted)",
              borderBottom: tab === t ? "2px solid var(--gold)" : "2px solid transparent",
              marginBottom: "-1px",
              transition: "color 0.15s",
            }}
          >
            {t === "leads" ? `Leads (${leads.length})` : "Configuración"}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)" }} className="text-sm">Cargando...</p>
      ) : (
        <>
          {tab === "leads" && (
            <WeddingLeadsTable leads={leads} onUpdate={handleLeadUpdate} />
          )}
          {tab === "config" && settings && (
            <WeddingPlannerConfig initial={settings} />
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar types + build check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Abrir en el navegador y verificar**

```bash
npm run dev
```

Navegar a `http://localhost:3000/admin/wedding-planner` (con sesión admin).

Verificar:
- Tab Leads muestra tabla vacía (o con el lead de prueba del Task 8)
- Click en fila abre el drawer
- Tab Configuración muestra el formulario con valores default
- Guardar configuración y recargar: valores persisten
- Cambiar estado de un lead y guardar

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/wedding-planner/ src/components/admin/wedding/
git commit -m "feat: admin wedding planner page (leads + config)"
```

---

## Task 12: Sidebar — agregar enlace Wedding Planner

**Files:**
- Modify: `src/components/admin/AdminSidebar.tsx`

- [ ] **Step 1: Agregar import del ícono**

En la línea de imports de lucide-react (alrededor de línea 8), agregar `Heart`:

```ts
import {
  LayoutDashboard, Package, PlusCircle, Images, CalendarDays,
  CheckSquare, Users, Bell, Settings, ShieldCheck, Menu, X, Eye, LogOut,
  TrendingUp, UserCog, Heart,
} from "lucide-react";
```

- [ ] **Step 2: Agregar a NAV_PRIMARY**

En el array `NAV_PRIMARY` (alrededor de línea 14), agregar antes del cierre del array:

```ts
{ href: "/admin/wedding-planner", label: "Wedding Planner", Icon: Heart },
```

El array quedará:

```ts
const NAV_PRIMARY = [
  { href: "/admin",                    label: "Panel",           Icon: LayoutDashboard },
  { href: "/admin/productos",          label: "Productos",       Icon: Package         },
  { href: "/admin/ventas/nueva",       label: "Nueva venta",     Icon: PlusCircle      },
  { href: "/admin/calendario",         label: "Calendario",      Icon: CalendarDays    },
  { href: "/admin/checklists",         label: "Checklists",      Icon: CheckSquare     },
  { href: "/admin/clientes",           label: "Clientes",        Icon: Users           },
  { href: "/admin/recordatorios",      label: "Recordatorios",   Icon: Bell            },
  { href: "/admin/wedding-planner",    label: "Wedding Planner", Icon: Heart           },
];
```

- [ ] **Step 3: Verificar types**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Verificar en browser**

Navegar al admin y verificar que el enlace "Wedding Planner" aparece en el sidebar, activo al estar en `/admin/wedding-planner`.

- [ ] **Step 5: Commit final**

```bash
git add src/components/admin/AdminSidebar.tsx
git commit -m "feat: add Wedding Planner link to admin sidebar"
```

---

## Verificación final

- [ ] `npm run build` — 0 errores de build
- [ ] Navegar a `/wedding-planner` — página visible con hero animado
- [ ] Enviar formulario de prueba — lead aparece en admin
- [ ] En admin, cambiar estado del lead y convertir a cliente CRM
- [ ] En admin > Configuración, agregar un tipo de evento y un testimonio, guardar, recargar `/wedding-planner` — cambios reflejados
- [ ] `git log --oneline -8` — 7 commits del feature
