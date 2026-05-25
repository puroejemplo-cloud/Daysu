# Service Landing Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear 7 páginas de destino SEO bajo `/servicios/[slug]` para rankear en búsquedas locales de bodas, XV años, fiestas, DJ, show robot, cabina de fotos y carrito de shots en Zacatecas.

**Architecture:** Ruta dinámica `src/app/servicios/[slug]/page.tsx` con `generateStaticParams` pre-renderiza 7 páginas estáticas en build time. Config central en `src/lib/service-pages.ts` define slug, copy SEO y filtro DB por página. UI en `src/components/servicios/ServicePage.tsx` (Server Component).

**Tech Stack:** Next.js 16 App Router, TypeScript, Prisma 7, Tailwind CSS 4 + CSS vars del proyecto (`--gold`, `--cream`, `--muted`), `aura-card`, `btn-gold` de globals.css

---

## File Map

| Acción | Archivo |
|---|---|
| Crear | `src/lib/service-pages.ts` |
| Crear | `src/components/servicios/ServicePage.tsx` |
| Crear | `src/app/servicios/[slug]/page.tsx` |
| Modificar | `src/app/sitemap.ts` |

---

### Task 1: Crear src/lib/service-pages.ts — config central

**Files:**
- Create: `src/lib/service-pages.ts`

- [ ] **Step 1: Crear el archivo con el contenido completo**

Crear `src/lib/service-pages.ts`:

```ts
export type ServiceDbFilter =
  | { type: "packages_all" }
  | { type: "category"; categoryNames: string[] }
  | { type: "name_contains"; keyword: string };

export type ServicePageConfig = {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  subtitle: string;
  features: string[];
  dbFilter: ServiceDbFilter;
  jsonLdDescription: string;
};

export const SERVICE_PAGES: ServicePageConfig[] = [
  {
    slug: "bodas-zacatecas",
    metaTitle: "DJ y Sonido para Bodas en Zacatecas — Daysu.vip",
    metaDescription: "Paquetes completos de DJ, audio, iluminación y shows para bodas en Zacatecas. Reserva en línea y aparta tu fecha con depósito.",
    h1: "DJ y Sonido para Bodas en Zacatecas",
    subtitle: "Hacemos que tu boda suene perfecta. Paquetes completos con DJ, iluminación y shows para hasta 500 invitados en Zacatecas.",
    features: [
      "Coordinamos con el venue y horarios de tu boda",
      "Repertorio personalizado: desde música de ceremonia hasta el after",
      "Equipo de respaldo incluido en todos los paquetes",
    ],
    dbFilter: { type: "packages_all" },
    jsonLdDescription: "Servicio de DJ, sonido e iluminación para bodas en Zacatecas. Paquetes completos para hasta 500 invitados con reserva en línea.",
  },
  {
    slug: "xv-anos-zacatecas",
    metaTitle: "Paquetes para XV Años en Zacatecas — Daysu.vip",
    metaDescription: "DJ, iluminación, cabina de fotos y shows para quinceañeras en Zacatecas. Paquetes completos para una noche inolvidable.",
    h1: "Paquetes para XV Años en Zacatecas",
    subtitle: "El día más especial merece el mejor servicio. DJ, iluminación, shows y más para tu quinceañera en Zacatecas.",
    features: [
      "Paquetes diseñados especialmente para quinceañeras",
      "Iluminación temática y efectos especiales incluidos",
      "Coordinación total el día del evento sin que te preocupes por nada",
    ],
    dbFilter: { type: "packages_all" },
    jsonLdDescription: "Servicio integral para quinceañeras en Zacatecas: DJ, iluminación, cabina de fotos y shows. Reserva en línea.",
  },
  {
    slug: "fiestas-zacatecas",
    metaTitle: "Sonido y Show para Fiestas en Zacatecas — Daysu.vip",
    metaDescription: "Equipo de sonido profesional, DJ, luces y shows para todo tipo de fiestas en Zacatecas. Hasta 500 invitados.",
    h1: "Sonido y Show para Fiestas en Zacatecas",
    subtitle: "Desde una fiesta íntima hasta un evento masivo. Paquetes de sonido, DJ y show para todas las ocasiones en Zacatecas.",
    features: [
      "Para fiestas desde 50 hasta 500 invitados",
      "DJ con equipo de sonido profesional certificado",
      "Shows y entretenimiento disponibles como complemento",
    ],
    dbFilter: { type: "packages_all" },
    jsonLdDescription: "DJ, sonido y shows para fiestas en Zacatecas. Capacidad hasta 500 invitados. Reserva en línea.",
  },
  {
    slug: "dj-zacatecas",
    metaTitle: "DJ para Eventos en Zacatecas — Daysu.vip",
    metaDescription: "DJ profesional para bodas, XV años y fiestas en Zacatecas. Equipo de sonido completo, iluminación y coordinación incluidos.",
    h1: "DJ Profesional para Eventos en Zacatecas",
    subtitle: "El mejor sonido para tu evento. DJ profesional con equipo completo de audio e iluminación disponible en Zacatecas.",
    features: [
      "DJ con experiencia en bodas, XV años y eventos corporativos",
      "Equipo de sonido profesional para cualquier tamaño de evento",
      "Reserva en línea y aparta tu fecha con el 30% de depósito",
    ],
    dbFilter: { type: "category", categoryNames: ["Sonido"] },
    jsonLdDescription: "DJ profesional para eventos en Zacatecas. Bodas, XV años, fiestas. Equipo de sonido e iluminación incluidos.",
  },
  {
    slug: "show-robot-zacatecas",
    metaTitle: "Show Robot LED en Zacatecas — Daysu.vip",
    metaDescription: "El espectacular Show Robot LED para bodas, XV años y fiestas en Zacatecas. El entretenimiento que todos recordarán.",
    h1: "Show Robot LED en Zacatecas",
    subtitle: "El show más espectacular para tu evento. El Robot LED es el entretenimiento que tus invitados no olvidarán en Zacatecas.",
    features: [
      "El entretenimiento más viral en bodas y quinceañeras",
      "Show completo con efectos LED y pirotecnia fría",
      "Disponible en Zacatecas y área metropolitana",
    ],
    dbFilter: { type: "name_contains", keyword: "robot" },
    jsonLdDescription: "Show Robot LED para bodas, XV años y fiestas en Zacatecas. Entretenimiento espectacular con efectos de luz.",
  },
  {
    slug: "cabina-fotos-zacatecas",
    metaTitle: "Cabina de Fotos para Eventos en Zacatecas — Daysu.vip",
    metaDescription: "Cabina de fotos profesional para bodas, XV años y fiestas en Zacatecas. Impresión instantánea y recuerdo para tus invitados.",
    h1: "Cabina de Fotos para Eventos en Zacatecas",
    subtitle: "El recuerdo perfecto para tus invitados. Cabina de fotos profesional con impresión instantánea para tu evento en Zacatecas.",
    features: [
      "Impresión instantánea de fotos en el evento",
      "Props y decoración temática incluidos",
      "Galería digital para todos los invitados tras el evento",
    ],
    dbFilter: { type: "category", categoryNames: ["Cabinas"] },
    jsonLdDescription: "Cabina de fotos para bodas, XV años y fiestas en Zacatecas. Impresión instantánea e ilimitada.",
  },
  {
    slug: "carrito-shots-zacatecas",
    metaTitle: "Carrito de Shots para Fiestas en Zacatecas — Daysu.vip",
    metaDescription: "Carrito de shots para bodas, XV años y fiestas en Zacatecas. El complemento perfecto para animar tu evento.",
    h1: "Carrito de Shots para Fiestas en Zacatecas",
    subtitle: "Anima tu evento con nuestro carrito de shots. Servicio profesional con presentación impecable para bodas y fiestas en Zacatecas.",
    features: [
      "Variedad de shots y bebidas personalizables para tu evento",
      "Servicio con presentación profesional y atención incluida",
      "Ideal para bodas, XV años y fiestas privadas en Zacatecas",
    ],
    dbFilter: { type: "category", categoryNames: ["Carritos de Comida"] },
    jsonLdDescription: "Carrito de shots para bodas, XV años y fiestas en Zacatecas. Servicio profesional incluido.",
  },
];
```

- [ ] **Step 2: Verificar type-check**

```bash
npx tsc --noEmit
```

Salida esperada: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/lib/service-pages.ts
git commit -m "feat(seo): add service pages config"
```

---

### Task 2: Crear src/components/servicios/ServicePage.tsx — UI

**Files:**
- Create: `src/components/servicios/ServicePage.tsx`

Este componente es un Server Component (sin `"use client"`). Recibe config + packages + waNumber como props y renderiza la página completa.

- [ ] **Step 1: Crear el archivo con el contenido completo**

Crear `src/components/servicios/ServicePage.tsx`:

```tsx
import Link from "next/link";
import Image from "next/image";
import type { ServicePageConfig } from "@/lib/service-pages";

export interface ServicePackage {
  id: number;
  name: string;
  sku: string;
  dailyRate: string;
  description: string | null;
  imageUrl: string | null;
  componentNames: string[];
}

interface ServicePageProps {
  config: ServicePageConfig;
  packages: ServicePackage[];
  waNumber: string;
}

export default function ServicePage({ config, packages, waNumber }: ServicePageProps) {
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hola, me interesa: ${config.h1}`)}`;

  return (
    <article style={{ color: "var(--cream)", maxWidth: "80rem", margin: "0 auto", padding: "0 1.25rem" }}>

      {/* Hero */}
      <section style={{ paddingTop: "5rem", paddingBottom: "3rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 700, marginBottom: "1rem" }}>
          Zacatecas, México
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 300, letterSpacing: "-0.02em", marginBottom: "1.25rem", lineHeight: 1.1 }}>
          {config.h1}
        </h1>
        <p style={{ fontSize: "1.1rem", color: "var(--muted)", maxWidth: "42rem", margin: "0 auto 2rem" }}>
          {config.subtitle}
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/reservar" className="btn-gold"
            style={{ padding: "0.75rem 2rem", borderRadius: "0.5rem", fontWeight: 700, textDecoration: "none" }}>
            Reservar ahora
          </Link>
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            style={{ padding: "0.75rem 2rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.15)", color: "var(--cream)", textDecoration: "none", fontWeight: 500 }}>
            WhatsApp
          </a>
        </div>
      </section>

      {/* Packages */}
      {packages.length > 0 && (
        <section style={{ paddingBottom: "3rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 500, marginBottom: "1.5rem", textAlign: "center" }}>
            Paquetes disponibles
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {packages.map((pkg) => (
              <Link key={pkg.id} href={`/catalogo/${pkg.sku.toLowerCase()}`} style={{ textDecoration: "none" }}>
                <div className="aura-card" style={{ padding: "1.25rem", borderRadius: "0.75rem", cursor: "pointer", height: "100%" }}>
                  {pkg.imageUrl && (
                    <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", marginBottom: "1rem", borderRadius: "0.5rem", overflow: "hidden" }}>
                      <Image
                        src={pkg.imageUrl}
                        alt={pkg.name}
                        fill
                        style={{ objectFit: "cover" }}
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  )}
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--cream)" }}>
                    {pkg.name}
                  </h3>
                  <p style={{ fontSize: "1.25rem", fontWeight: 300, color: "var(--gold)", marginBottom: "0.5rem" }}>
                    ${Number(pkg.dailyRate).toLocaleString("es-MX")}{" "}
                    <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>MXN</span>
                  </p>
                  {pkg.componentNames.length > 0 && (
                    <ul style={{ fontSize: "0.75rem", color: "var(--muted)", listStyle: "none", padding: 0, margin: 0 }}>
                      {pkg.componentNames.slice(0, 4).map((c) => (
                        <li key={c} style={{ marginBottom: "0.2rem" }}>· {c}</li>
                      ))}
                      {pkg.componentNames.length > 4 && (
                        <li style={{ color: "var(--gold)" }}>+ {pkg.componentNames.length - 4} más</li>
                      )}
                    </ul>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section style={{ paddingBottom: "3rem", maxWidth: "42rem", margin: "0 auto" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 500, marginBottom: "1.5rem", textAlign: "center" }}>
          ¿Por qué elegirnos?
        </h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
          {config.features.map((feature) => (
            <li key={feature} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <span style={{ color: "var(--gold)", fontWeight: 700, flexShrink: 0 }}>✓</span>
              <span style={{ color: "var(--cream)" }}>{feature}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA final */}
      <section style={{ paddingBottom: "5rem", textAlign: "center" }}>
        <div className="admin-surface"
          style={{ padding: "2rem", borderRadius: "1rem", display: "inline-block", maxWidth: "36rem", width: "100%" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 500, marginBottom: "0.5rem" }}>
            ¿Listo para reservar?
          </h2>
          <p style={{ color: "var(--muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
            Aparta tu fecha con solo el 30% de depósito
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/reservar" className="btn-gold"
              style={{ padding: "0.75rem 2rem", borderRadius: "0.5rem", fontWeight: 700, textDecoration: "none" }}>
              Reservar ahora
            </Link>
            <Link href="/catalogo"
              style={{ padding: "0.75rem 2rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.15)", color: "var(--cream)", textDecoration: "none" }}>
              Ver todos los paquetes
            </Link>
          </div>
        </div>
      </section>

    </article>
  );
}
```

- [ ] **Step 2: Verificar type-check**

```bash
npx tsc --noEmit
```

Salida esperada: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/components/servicios/ServicePage.tsx
git commit -m "feat(seo): add ServicePage UI component"
```

---

### Task 3: Crear src/app/servicios/[slug]/page.tsx — Route handler

**Files:**
- Create: `src/app/servicios/[slug]/page.tsx`

- [ ] **Step 1: Crear el directorio y el archivo**

Crear `src/app/servicios/[slug]/page.tsx` con el siguiente contenido completo:

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SERVICE_PAGES, type ServiceDbFilter } from "@/lib/service-pages";
import { getWhatsAppSettings } from "@/lib/cached-settings";
import ServicePage from "@/components/servicios/ServicePage";
import type { ServicePackage } from "@/components/servicios/ServicePage";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return SERVICE_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const config = SERVICE_PAGES.find((p) => p.slug === slug);
  if (!config) return {};
  const BASE_URL = process.env.NEXTAUTH_URL ?? "https://daysu.vip";
  return {
    title: config.metaTitle,
    description: config.metaDescription,
    openGraph: {
      title: config.metaTitle,
      description: config.metaDescription,
      url: `${BASE_URL}/servicios/${slug}`,
      type: "website",
    },
  };
}

async function getPackages(filter: ServiceDbFilter): Promise<ServicePackage[]> {
  const baseWhere = { isActive: true, isRentable: true, assetType: "package" as const };

  try {
    type WhereClause = Parameters<typeof prisma.asset.findMany>[0]["where"];
    let where: WhereClause;

    if (filter.type === "packages_all") {
      where = baseWhere;
    } else if (filter.type === "category") {
      where = { ...baseWhere, category: { name: { in: filter.categoryNames } } };
    } else {
      where = { ...baseWhere, name: { contains: filter.keyword, mode: "insensitive" as const } };
    }

    const assets = await prisma.asset.findMany({
      where,
      select: {
        id: true, name: true, sku: true, dailyRate: true,
        description: true, imageUrl: true,
        components: {
          include: { childAsset: { select: { name: true, dailyRate: true } } },
        },
      },
      orderBy: [{ isRecommended: "desc" }, { dailyRate: "asc" }],
      take: 6,
    });

    // Si filtro específico no devuelve nada → fallback a todos los packages
    if (assets.length === 0 && filter.type !== "packages_all") {
      return getPackages({ type: "packages_all" });
    }

    return assets.map((a) => ({
      id:             a.id,
      name:           a.name,
      sku:            a.sku,
      dailyRate:      a.dailyRate.toString(),
      description:    a.description,
      imageUrl:       a.imageUrl,
      componentNames: [...a.components]
        .sort((x, y) => Number(y.childAsset.dailyRate) - Number(x.childAsset.dailyRate))
        .map((c) => c.childAsset.name),
    }));
  } catch {
    return [];
  }
}

export default async function ServiceLandingPage({ params }: Props) {
  const { slug } = await params;
  const config = SERVICE_PAGES.find((p) => p.slug === slug);
  if (!config) notFound();

  const BASE_URL = process.env.NEXTAUTH_URL ?? "https://daysu.vip";

  const [packages, { number: waNumber }] = await Promise.all([
    getPackages(config.dbFilter),
    getWhatsAppSettings(),
  ]);

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": config.h1,
    "description": config.jsonLdDescription,
    "provider": {
      "@type": "LocalBusiness",
      "name": "Daysu.vip — Aura Producciones",
      "url": "https://daysu.vip",
    },
    "areaServed": {
      "@type": "City",
      "name": "Zacatecas",
    },
    "url": `${BASE_URL}/servicios/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <ServicePage
        config={config}
        packages={packages}
        waNumber={waNumber ?? "524929496372"}
      />
    </>
  );
}
```

- [ ] **Step 2: Verificar type-check**

```bash
npx tsc --noEmit
```

Salida esperada: sin errores.

- [ ] **Step 3: Verificar en dev server**

```bash
npm run dev
```

Abrir `http://localhost:3000/servicios/bodas-zacatecas` — debe cargar la página con H1 "DJ y Sonido para Bodas en Zacatecas", sección de paquetes y CTA.

Abrir `http://localhost:3000/servicios/slug-invalido` — debe mostrar la página 404 de Next.js.

- [ ] **Step 4: Commit**

```bash
git add src/app/servicios/[slug]/page.tsx
git commit -m "feat(seo): add service landing pages route /servicios/[slug]"
```

---

### Task 4: Actualizar src/app/sitemap.ts — agregar páginas de servicio

**Files:**
- Modify: `src/app/sitemap.ts`

El archivo actual tiene 3 URLs estáticas + catálogo dinámico. Hay que agregar las 7 URLs de servicios.

- [ ] **Step 1: Reemplazar el contenido completo de src/app/sitemap.ts**

```ts
import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SERVICE_PAGES } from "@/lib/service-pages";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXTAUTH_URL ?? "https://daysu.vip";
  const now  = new Date();

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${base}/`,         lastModified: now, changeFrequency: "weekly",  priority: 1.0  },
    { url: `${base}/catalogo`, lastModified: now, changeFrequency: "weekly",  priority: 0.9  },
    { url: `${base}/reservar`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
  ];

  const serviceUrls: MetadataRoute.Sitemap = SERVICE_PAGES.map((p) => ({
    url:             `${base}/servicios/${p.slug}`,
    lastModified:    now,
    changeFrequency: "monthly" as const,
    priority:        0.85,
  }));

  try {
    const assets = await prisma.asset.findMany({
      where:  { isActive: true, isRentable: true },
      select: { sku: true, updatedAt: true },
    });

    const catalogUrls: MetadataRoute.Sitemap = assets.map((a) => ({
      url:             `${base}/catalogo/${a.sku.toLowerCase()}`,
      lastModified:    a.updatedAt,
      changeFrequency: "weekly" as const,
      priority:        0.8,
    }));

    return [...staticUrls, ...serviceUrls, ...catalogUrls];
  } catch {
    return [...staticUrls, ...serviceUrls];
  }
}
```

- [ ] **Step 2: Verificar type-check**

```bash
npx tsc --noEmit
```

Salida esperada: sin errores.

- [ ] **Step 3: Verificar en dev server**

Abrir `http://localhost:3000/sitemap.xml` — debe incluir las 7 URLs de servicios con priority 0.85:

```xml
<url>
  <loc>http://localhost:3000/servicios/bodas-zacatecas</loc>
  <priority>0.85</priority>
</url>
```

- [ ] **Step 4: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat(seo): add service pages to sitemap"
```

---

### Task 5: Deploy a producción

**Files:** ninguno — solo push

- [ ] **Step 1: Push a master**

```bash
git push origin master
```

Esperar que el deploy de Vercel complete (2-3 minutos).

- [ ] **Step 2: Verificar páginas en producción**

Abrir estas URLs y verificar que cargan correctamente:
- `https://daysu.vip/servicios/bodas-zacatecas`
- `https://daysu.vip/servicios/xv-anos-zacatecas`
- `https://daysu.vip/servicios/show-robot-zacatecas`
- `https://daysu.vip/sitemap.xml` — verificar que las 7 URLs de servicios aparecen

- [ ] **Step 3: Enviar nuevo sitemap a Search Console**

En `search.google.com/search-console` → Sitemaps → el sitemap existente debería actualizarse automáticamente. Si no, hacer click en "Volver a enviar".
