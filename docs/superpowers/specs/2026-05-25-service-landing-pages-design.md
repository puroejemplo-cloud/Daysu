# Páginas de Destino por Servicio — Daysu.vip

**Fecha:** 2026-05-25
**Stack:** Next.js 16 App Router, TypeScript, Prisma 7, Tailwind CSS 4

## Objetivo

Crear 7 páginas de destino SEO bajo `/servicios/[slug]` para rankear en búsquedas locales de Zacatecas:
- bodas, XV años, fiestas, DJ, show robot, cabina de fotos, carrito de shots

---

## Arquitectura

### Patrón: Ruta dinámica con `generateStaticParams`

Un solo archivo `src/app/servicios/[slug]/page.tsx` genera las 7 páginas en build time. Google ve HTML estático completamente renderizado — idéntico a 7 archivos individuales en términos de SEO.

```
src/
  lib/
    service-pages.ts          ← config central (slugs, copy, filtros DB)
  app/
    servicios/
      [slug]/
        page.tsx              ← route handler + metadata + JSON-LD
  components/
    servicios/
      ServicePage.tsx         ← UI: Hero + Packages + Features + CTA
```

---

## 1. `src/lib/service-pages.ts` — Config central

```ts
export type ServicePageConfig = {
  slug: string;
  metaTitle: string;        // <title> tag
  metaDescription: string;  // meta description (155 chars max)
  h1: string;               // Heading principal (keyword-rich)
  subtitle: string;         // Párrafo debajo del H1
  features: string[];       // 3 bullets "Por qué elegirnos"
  dbFilter: ServiceDbFilter;
  jsonLdDescription: string;
};

export type ServiceDbFilter =
  | { type: "packages_all" }
  | { type: "category"; categoryNames: string[] }
  | { type: "name_contains"; keyword: string };
```

### Las 7 páginas configuradas

| slug | h1 | dbFilter |
|---|---|---|
| `bodas-zacatecas` | DJ y Sonido para Bodas en Zacatecas | `packages_all` |
| `xv-anos-zacatecas` | Paquetes para XV Años en Zacatecas | `packages_all` |
| `fiestas-zacatecas` | Sonido y Show para Fiestas en Zacatecas | `packages_all` |
| `dj-zacatecas` | DJ Profesional para Eventos en Zacatecas | `category: ["Sonido"]` |
| `show-robot-zacatecas` | Show Robot LED en Zacatecas | `name_contains: "robot"` |
| `cabina-fotos-zacatecas` | Cabina de Fotos para Eventos en Zacatecas | `category: ["Cabinas"]` |
| `carrito-shots-zacatecas` | Carrito de Shots para Fiestas en Zacatecas | `category: ["Carritos de Comida"]` |

Metadata completa para cada página:

**bodas-zacatecas**
- metaTitle: `DJ y Sonido para Bodas en Zacatecas — Daysu.vip`
- metaDescription: `Paquetes completos de DJ, audio, iluminación y shows para bodas en Zacatecas. Reserva en línea y aparta tu fecha con depósito.`
- features: ["Coordinamos con el venue y horarios", "Repertorio personalizado para tu boda", "Equipo de respaldo incluido en todos los paquetes"]

**xv-anos-zacatecas**
- metaTitle: `Paquetes para XV Años en Zacatecas — Daysu.vip`
- metaDescription: `DJ, iluminación, cabina de fotos y shows para quinceañeras en Zacatecas. Paquetes completos con todo incluido para una noche inolvidable.`
- features: ["Paquetes diseñados para quinceañeras", "Iluminación temática y efectos especiales", "Coordinación total el día del evento"]

**fiestas-zacatecas**
- metaTitle: `Sonido y Show para Fiestas en Zacatecas — Daysu.vip`
- metaDescription: `Equipo de sonido profesional, DJ, luces y shows para todo tipo de fiestas en Zacatecas. Hasta 500 invitados.`
- features: ["Para fiestas desde 50 hasta 500 invitados", "DJ con equipo de sonido profesional", "Shows y entretenimiento disponibles"]

**dj-zacatecas**
- metaTitle: `DJ para Eventos en Zacatecas — Daysu.vip`
- metaDescription: `DJ profesional para bodas, XV años y fiestas en Zacatecas. Equipo de sonido completo, iluminación y coordinación incluidos.`
- features: ["DJ con experiencia en todo tipo de eventos", "Equipo de sonido profesional certificado", "Reserva en línea con apartado del 30%"]

**show-robot-zacatecas**
- metaTitle: `Show Robot LED en Zacatecas — Daysu.vip`
- metaDescription: `El espectacular Show Robot LED para bodas, XV años y fiestas en Zacatecas. El entretenimiento que todos recordarán.`
- features: ["El entretenimiento más viral en eventos", "Show completo con efectos LED y pirotecnia fría", "Disponible en toda el área de Zacatecas"]

**cabina-fotos-zacatecas**
- metaTitle: `Cabina de Fotos para Eventos en Zacatecas — Daysu.vip`
- metaDescription: `Cabina de fotos profesional para bodas, XV años y fiestas en Zacatecas. Impresión instantánea, props incluidos y recuerdo para tus invitados.`
- features: ["Impresión instantánea de fotos en el evento", "Props y decoración temática incluidos", "Galería digital para todos los invitados"]

**carrito-shots-zacatecas**
- metaTitle: `Carrito de Shots para Fiestas en Zacatecas — Daysu.vip`
- metaDescription: `Carrito de shots para bodas, XV años y fiestas en Zacatecas. El complemento perfecto para animar tu evento.`
- features: ["Variedad de shots y bebidas personalizables", "Servicio con presentación profesional", "Ideal para bodas, XV años y fiestas privadas"]

---

## 2. `src/app/servicios/[slug]/page.tsx` — Route handler

### `generateStaticParams`

Genera los 7 slugs en build time para pre-renderizado estático:
```ts
export async function generateStaticParams() {
  return SERVICE_PAGES.map((p) => ({ slug: p.slug }));
}
```

### `generateMetadata`

Usa el config para generar metadata completa (title, description, OG, Twitter):
```ts
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const config = SERVICE_PAGES.find((p) => p.slug === slug);
  if (!config) return {};
  return {
    title: config.metaTitle,
    description: config.metaDescription,
    openGraph: { title: config.metaTitle, description: config.metaDescription, ... }
  };
}
```

### DB query dinámica

Basada en `config.dbFilter`:
- `packages_all` → `where: { isActive: true, isRentable: true, assetType: "package" }`
- `category` → agrega `category: { name: { in: categoryNames } }`
- `name_contains` → agrega `name: { contains: keyword, mode: "insensitive" }`

Si la query retorna 0 resultados (ej. show robot no encontrado), fallback a `packages_all`.

### JSON-LD `Service`

```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "[config.h1]",
  "description": "[config.jsonLdDescription]",
  "provider": {
    "@type": "LocalBusiness",
    "name": "Daysu.vip — Aura Producciones",
    "url": "https://daysu.vip"
  },
  "areaServed": {
    "@type": "City",
    "name": "Zacatecas"
  },
  "url": "https://daysu.vip/servicios/[slug]"
}
```

### `notFound()` para slugs inválidos

Si el slug no está en el config → `notFound()`.

---

## 3. `src/components/servicios/ServicePage.tsx` — UI

Server Component. Estructura:

```
<article>
  <!-- Hero -->
  <section>
    <h1>{config.h1}</h1>
    <p>{config.subtitle}</p>
    <Link href="/reservar">Reservar ahora</Link>
  </section>

  <!-- Packages (de DB) -->
  {packages.length > 0 && (
    <section>
      <h2>Paquetes disponibles</h2>
      <div className="grid">
        {packages.map(p => <PackageCard key={p.id} {...p} />)}
      </div>
    </section>
  )}

  <!-- Features -->
  <section>
    <h2>¿Por qué elegirnos?</h2>
    <ul>
      {config.features.map(f => <li>{f}</li>)}
    </ul>
  </section>

  <!-- CTA -->
  <section>
    <Link href="/reservar">Reservar ahora</Link>
    <a href="https://wa.me/[waNumber]">WhatsApp</a>
    <Link href="/catalogo">Ver todos los paquetes</Link>
  </section>
</article>
```

**`PackageCard`** — componente interno de `ServicePage.tsx`. Muestra: foto, nombre, precio formateado, lista de componentes BOM. Enlaza a `/catalogo/[sku]`. Reutiliza clases CSS existentes del proyecto (`aura-card`, `btn-gold`, `--gold`).

**WhatsApp number:** se lee de `system_settings` vía `getWhatsAppSettings()` (ya existe en `@/lib/cached-settings`).

---

## 4. Actualización de `src/app/sitemap.ts`

Agregar las 7 URLs de servicios al sitemap dinámico. Prioridad `0.85` (entre `/catalogo` y las páginas de detalle individuales).

```ts
const serviceUrls: MetadataRoute.Sitemap = SERVICE_PAGES.map((p) => ({
  url: `${base}/servicios/${p.slug}`,
  lastModified: now,
  changeFrequency: "monthly" as const,
  priority: 0.85,
}));

return [...staticUrls, ...serviceUrls, ...catalogUrls];
```

Import: `import { SERVICE_PAGES } from "@/lib/service-pages";`

---

## Archivos afectados

| Acción | Archivo |
|---|---|
| Crear | `src/lib/service-pages.ts` |
| Crear | `src/app/servicios/[slug]/page.tsx` |
| Crear | `src/components/servicios/ServicePage.tsx` |
| Modificar | `src/app/sitemap.ts` |

## Revalidación

`export const revalidate = 3600;` en la route page — se regenera cada hora si hay cambios en DB (precios, nuevos paquetes).

## Out of scope

- Panel admin para editar el copy de las páginas de servicio
- Imágenes hero personalizadas por servicio (usa imágenes de los paquetes del DB)
- Páginas de servicio para más ciudades (solo Zacatecas)
- Blog o contenido largo-form
