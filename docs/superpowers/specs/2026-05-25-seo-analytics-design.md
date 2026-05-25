# SEO Técnico + Analytics — Daysu.vip

**Fecha:** 2026-05-25  
**Stack:** Next.js 16 (App Router), TypeScript, `@next/third-parties`

## Objetivo

Implementar las capas técnicas de visibilidad web para Daysu.vip:
1. `robots.txt` correcto con bloqueo de rutas privadas
2. Sitemap dinámico que incluya todas las páginas de catálogo
3. Structured data (JSON-LD) para rich results en Google
4. Google Analytics 4 para medir tráfico y conversiones

Meta Pixel no se implementa en esta iteración.

---

## 1. robots.txt

**Archivo nuevo:** `src/app/robots.ts`

Next.js App Router genera `/robots.txt` desde este módulo.

```ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXTAUTH_URL ?? "https://daysu.vip";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/superadmin/", "/api/", "/login"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
```

---

## 2. Sitemap dinámico

**Archivo existente:** `src/app/sitemap.ts` (reemplazar)

**Bug a corregir:** el fallback de `base` usa `"auraproduccionesvip.com"` pero el dominio activo es `daysu.vip`. Se unifica a `daysu.vip`.

**Cambio principal:** consulta a Prisma para obtener todos los activos `isActive: true, isRentable: true` y genera una entrada por cada SKU en `/catalogo/[sku]`.

Estructura de URLs resultantes:
| URL | Frecuencia | Prioridad |
|---|---|---|
| `/` | weekly | 1.0 |
| `/catalogo` | weekly | 0.9 |
| `/reservar` | monthly | 0.85 |
| `/catalogo/[sku-lowercase]` × N | weekly | 0.8 |

**Nota:** Si Prisma falla en build time (BD no disponible), el try/catch retorna solo las 3 URLs estáticas — mismo comportamiento que hoy.

---

## 3. JSON-LD Structured Data

### 3a. Homepage — `LocalBusiness`

**Archivo:** `src/app/page.tsx`

Se agrega un componente inline `<JsonLd>` (o directamente `<script>`) que renderiza:

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Daysu.vip — Aura Producciones",
  "description": "Paquetes de DJ, audio, iluminación y shows para bodas, quinceañeras y eventos hasta 500 personas en Zacatecas.",
  "url": "https://daysu.vip",
  "telephone": "+524929496372",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Zacatecas",
    "addressRegion": "ZAC",
    "addressCountry": "MX"
  },
  "priceRange": "$$",
  "sameAs": []
}
```

El número de teléfono se lee de la constante ya presente en el archivo (`"524929496372"` → se formatea como `"+524929496372"`).

### 3b. Páginas de paquete — `Product`

**Archivo:** `src/app/catalogo/[id]/page.tsx`

Se agrega al final de `generateMetadata` (o como componente server-side en `Page`) un `<script type="application/ld+json">` con:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "[asset.name]",
  "description": "[asset.description primera línea]",
  "image": "[asset.imageUrl o primera de imageGallery]",
  "offers": {
    "@type": "Offer",
    "price": "[asset.dailyRate]",
    "priceCurrency": "MXN",
    "availability": "https://schema.org/InStock",
    "url": "https://daysu.vip/catalogo/[sku]"
  },
  "brand": {
    "@type": "Brand",
    "name": "Daysu.vip"
  }
}
```

El JSON-LD se inyecta en el Server Component `PackageDetailPage` (no en `generateMetadata` — ese devuelve `Metadata`, no JSX).

---

## 4. Google Analytics 4

**Dependencia nueva:** `@next/third-parties` (paquete oficial Next.js)

```bash
npm install @next/third-parties
```

**Archivo modificado:** `src/app/layout.tsx`

```tsx
import { GoogleAnalytics } from "@next/third-parties/google";

// Dentro del <body>, justo antes del cierre:
{process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_GA_ID && (
  <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
)}
```

**Variable de entorno nueva:**
```
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
```

Se agrega a `.env.example`. Se configura en Vercel (Settings → Environment Variables).

**Comportamiento:**
- Solo carga en `production` — datos de dev no contaminan GA4
- `@next/third-parties` usa `strategy="afterInteractive"` internamente → no bloquea LCP
- No requiere banner de cookies (GA4 en modo básico sin cookies cross-site, pero si se quiere ser estrictamente GDPR-compliant en el futuro, se puede añadir consent mode)

---

## 5. Variables de entorno actualizadas

| Variable | Descripción | Requerida |
|---|---|---|
| `NEXT_PUBLIC_GA_ID` | Measurement ID de GA4 (ej: `G-XXXXXXXXXX`) | Para analytics |

Todas las demás variables existentes permanecen sin cambio.

---

## 6. Post-deploy: Google Search Console

Después de deploy, el usuario debe:
1. Ir a [search.google.com/search-console](https://search.google.com/search-console)
2. Agregar propiedad → "Dominio" → ingresar `daysu.vip`
3. Verificar via DNS TXT (Vercel DNS → agregar registro TXT)
4. Una vez verificado → Sitemaps → ingresar `https://daysu.vip/sitemap.xml` → Enviar
5. Linkear Search Console con GA4 para datos integrados

---

## Archivos afectados

| Acción | Archivo |
|---|---|
| Crear | `src/app/robots.ts` |
| Modificar | `src/app/sitemap.ts` |
| Modificar | `src/app/page.tsx` |
| Modificar | `src/app/catalogo/[id]/page.tsx` |
| Modificar | `src/app/layout.tsx` |
| Modificar | `.env.example` |

## Out of scope

- Meta Pixel (diferido)
- Consent mode / banner de cookies GDPR
- Páginas de destino por servicio (contenido, no técnico)
- Google Ads conversion tracking
