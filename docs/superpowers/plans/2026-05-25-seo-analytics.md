# SEO Técnico + Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar robots.txt, sitemap dinámico, JSON-LD structured data y Google Analytics 4 en Daysu.vip para mejorar visibilidad en buscadores y medir tráfico.

**Architecture:** Usamos las APIs nativas de Next.js App Router (`robots.ts`, `sitemap.ts`) para generar archivos de indexación. El JSON-LD se inyecta como `<script type="application/ld+json">` directamente en Server Components. GA4 se carga via el paquete oficial `@next/third-parties/google`, solo en producción.

**Tech Stack:** Next.js 16 App Router, TypeScript, `@next/third-parties`, Prisma 7 (para sitemap dinámico)

---

## File Map

| Acción | Archivo |
|---|---|
| Crear | `src/app/robots.ts` |
| Modificar | `src/app/sitemap.ts` |
| Modificar | `src/app/page.tsx` |
| Modificar | `src/app/catalogo/[id]/page.tsx` |
| Modificar | `src/app/layout.tsx` |
| Modificar | `.env.example` |

---

### Task 1: Instalar dependencia y actualizar .env.example

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Instalar @next/third-parties**

```bash
npm install @next/third-parties
```

Salida esperada: `added N packages` sin errores.

- [ ] **Step 2: Agregar NEXT_PUBLIC_GA_ID a .env.example**

En `.env.example`, al final del archivo, agregar la sección:

```
# ── Analytics ─────────────────────────────────────────────────────────────────
# Google Analytics 4 Measurement ID — se obtiene en analytics.google.com
# Solo se carga en producción (NODE_ENV=production)
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: install @next/third-parties, add GA4 env var to example"
```

---

### Task 2: Crear robots.ts

**Files:**
- Create: `src/app/robots.ts`

- [ ] **Step 1: Crear el archivo**

Crear `src/app/robots.ts` con el siguiente contenido completo:

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

- [ ] **Step 2: Verificar en el servidor de desarrollo**

```bash
npm run dev
```

Abrir `http://localhost:3000/robots.txt` en el navegador. Debe mostrar:

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /superadmin/
Disallow: /api/
Disallow: /login

Sitemap: http://localhost:3000/sitemap.xml
```

- [ ] **Step 3: Commit**

```bash
git add src/app/robots.ts
git commit -m "feat(seo): add robots.txt via Next.js App Router"
```

---

### Task 3: Ampliar sitemap.ts con páginas de catálogo dinámicas

**Files:**
- Modify: `src/app/sitemap.ts`

El archivo actual tiene solo 3 URLs estáticas y usa un fallback de dominio incorrecto (`auraproduccionesvip.com`). Se reemplaza completamente.

- [ ] **Step 1: Reemplazar src/app/sitemap.ts**

Reemplazar el contenido completo del archivo con:

```ts
import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXTAUTH_URL ?? "https://daysu.vip";
  const now  = new Date();

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${base}/`,         lastModified: now, changeFrequency: "weekly",  priority: 1.0  },
    { url: `${base}/catalogo`, lastModified: now, changeFrequency: "weekly",  priority: 0.9  },
    { url: `${base}/reservar`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
  ];

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

    return [...staticUrls, ...catalogUrls];
  } catch {
    return staticUrls;
  }
}
```

- [ ] **Step 2: Verificar en el servidor de desarrollo**

Con el servidor corriendo, abrir `http://localhost:3000/sitemap.xml`.

Debe mostrar las 3 URLs estáticas más una entrada por cada paquete/producto activo del catálogo. Ejemplo:

```xml
<url>
  <loc>http://localhost:3000/catalogo/pkg-mediano</loc>
  <lastmod>2026-05-25</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
</url>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat(seo): expand sitemap with dynamic catalog pages"
```

---

### Task 4: JSON-LD LocalBusiness en la homepage

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Agregar el script JSON-LD al return de HomePage**

En `src/app/page.tsx`, localizar el bloque `return` al final de la función `HomePage` (línea ~146):

```tsx
  return (
    <>
    <HomeClient
      ...
    />
    <WeddingFloatingCTA heroImage={wpPlannerPhoto ?? wpHeroImage} />
    </>
  );
```

Reemplazar ese bloque con:

```tsx
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Daysu.vip — Aura Producciones",
    "description": "Paquetes de DJ, audio, iluminación y shows para bodas, quinceañeras y eventos hasta 500 personas en Zacatecas.",
    "url": "https://daysu.vip",
    "telephone": `+${whatsappSetting?.value ?? "524929496372"}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Zacatecas",
      "addressRegion": "ZAC",
      "addressCountry": "MX"
    },
    "priceRange": "$$",
    "sameAs": []
  };

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
    />
    <HomeClient
      carouselImages={carouselImages}
      whatsappNumber={whatsappSetting?.value ?? "524929496372"}
      googleReviews={googleReviews}
      packages={packages.map((p) => ({
        ...p,
        dailyRate:      p.dailyRate.toString(),
        originalPrice:  p.originalPrice?.toString() ?? null,
        ownerName:      p.ownerAdmin?.fullName ?? null,
        imageUrl:       imageMap.get(p.id) ?? null,
        imageGallery:   galleryMap.get(p.id) ?? [],
        componentNames: compMap.get(p.id) ?? [],
      }))}
    />
    <WeddingFloatingCTA heroImage={wpPlannerPhoto ?? wpHeroImage} />
    </>
  );
```

- [ ] **Step 2: Verificar en el navegador**

Con el servidor corriendo, abrir `http://localhost:3000`, hacer clic derecho → "Ver código fuente de la página" y buscar `application/ld+json`. Debe aparecer el objeto JSON con `"@type": "LocalBusiness"`.

- [ ] **Step 3: Verificar con type-check**

```bash
npx tsc --noEmit
```

Salida esperada: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(seo): add LocalBusiness JSON-LD structured data to homepage"
```

---

### Task 5: JSON-LD Product en páginas de detalle del catálogo

**Files:**
- Modify: `src/app/catalogo/[id]/page.tsx`

- [ ] **Step 1: Agregar el script JSON-LD al return de PackageDetailPage**

En `src/app/catalogo/[id]/page.tsx`, localizar la función `PackageDetailPage` (línea ~62). Insertar la generación del JSON-LD y modificar el return:

Reemplazar el bloque `return` actual (línea ~88):

```tsx
  return (
    <PackageDetail
      asset={{
        id:            asset.id,
        name:          asset.name,
        sku:           asset.sku,
        dailyRate:     asset.dailyRate.toString(),
        originalPrice: asset.originalPrice?.toString() ?? null,
        description:   asset.description,
        categoryName:  asset.category.name,
        ownerName:     asset.ownerAdmin?.fullName ?? null,
        imageUrl:      asset.imageUrl,
        imageGallery:  gallery,
        pricingTiers:  (asset.pricingTiers ?? null) as PricingConfig | null,
        maxGuests:     asset.maxGuests,
        isRecommended: asset.isRecommended,
        promoType:     asset.promoType,
        componentNames,
      }}
      relatedProducts={relatedProducts}
    />
  );
```

Reemplazar con:

```tsx
  const BASE_URL = process.env.NEXTAUTH_URL ?? "https://daysu.vip";
  const firstLine = (asset.description ?? "").split("\n")[0]?.trim();
  const ogImage = gallery[0] ?? asset.imageUrl ?? undefined;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": asset.name,
    "description": firstLine || asset.name,
    ...(ogImage ? { "image": ogImage } : {}),
    "offers": {
      "@type": "Offer",
      "price": asset.dailyRate.toString(),
      "priceCurrency": "MXN",
      "availability": "https://schema.org/InStock",
      "url": `${BASE_URL}/catalogo/${asset.sku.toLowerCase()}`,
    },
    "brand": {
      "@type": "Brand",
      "name": "Daysu.vip"
    }
  };

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
    />
    <PackageDetail
      asset={{
        id:            asset.id,
        name:          asset.name,
        sku:           asset.sku,
        dailyRate:     asset.dailyRate.toString(),
        originalPrice: asset.originalPrice?.toString() ?? null,
        description:   asset.description,
        categoryName:  asset.category.name,
        ownerName:     asset.ownerAdmin?.fullName ?? null,
        imageUrl:      asset.imageUrl,
        imageGallery:  gallery,
        pricingTiers:  (asset.pricingTiers ?? null) as PricingConfig | null,
        maxGuests:     asset.maxGuests,
        isRecommended: asset.isRecommended,
        promoType:     asset.promoType,
        componentNames,
      }}
      relatedProducts={relatedProducts}
    />
    </>
  );
```

- [ ] **Step 2: Verificar en el navegador**

Abrir cualquier página de detalle, ej. `http://localhost:3000/catalogo/pkg-mediano`. Ver código fuente → buscar `application/ld+json`. Debe mostrar el objeto con `"@type": "Product"` y el precio en MXN.

- [ ] **Step 3: Verificar con type-check**

```bash
npx tsc --noEmit
```

Salida esperada: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/app/catalogo/[id]/page.tsx
git commit -m "feat(seo): add Product JSON-LD structured data to catalog detail pages"
```

---

### Task 6: Google Analytics 4 en layout.tsx

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Agregar el import de GoogleAnalytics**

En `src/app/layout.tsx`, agregar en la sección de imports (después de los imports de componentes existentes, línea ~8):

```tsx
import { GoogleAnalytics } from "@next/third-parties/google";
```

- [ ] **Step 2: Agregar el componente al body**

En `src/app/layout.tsx`, localizar el cierre del `</body>` (actualmente el `</AuthSessionProvider>` está justo antes):

Reemplazar el bloque del body desde la línea del `<AuthSessionProvider>` hasta el cierre `</body>`:

```tsx
      <body style={{...}}>
        <AuthSessionProvider>
          <PWARegister />
          <a href="#main-content" className="skip-link">Saltar al contenido</a>
          <Navbar />
          <main id="main-content">{children}</main>
          <WhatsAppButton number={waNumber} message={waMessage} />
          {/* Safe area bottom — espacio para la barra home del iPhone */}
          <div style={{ height: "env(safe-area-inset-bottom)" }} />
        </AuthSessionProvider>
      </body>
```

Reemplazar con:

```tsx
      <body style={{
        background: "#05051a",
        color: "#f5f0e8",
        fontFamily: "var(--font-dm, DM Sans, sans-serif)",
        overflowX: "hidden",
        WebkitTapHighlightColor: "transparent",
        WebkitTextSizeAdjust: "100%",
      }}>
        <AuthSessionProvider>
          <PWARegister />
          <a href="#main-content" className="skip-link">Saltar al contenido</a>
          <Navbar />
          <main id="main-content">{children}</main>
          <WhatsAppButton number={waNumber} message={waMessage} />
          {/* Safe area bottom — espacio para la barra home del iPhone */}
          <div style={{ height: "env(safe-area-inset-bottom)" }} />
        </AuthSessionProvider>
        {process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
```

- [ ] **Step 3: Verificar con type-check**

```bash
npx tsc --noEmit
```

Salida esperada: sin errores.

- [ ] **Step 4: Verificar que NO carga en desarrollo**

Con el servidor de desarrollo corriendo, abrir `http://localhost:3000`, abrir DevTools → Network → buscar `googletagmanager`. **No debe aparecer** (solo carga en `NODE_ENV=production`).

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(analytics): add Google Analytics 4 via @next/third-parties"
```

---

### Task 7: Configurar NEXT_PUBLIC_GA_ID en Vercel

> Esta tarea requiere acceso al panel de Vercel y una cuenta de Google Analytics 4.

- [ ] **Step 1: Crear cuenta GA4 (si no existe)**

1. Ir a `analytics.google.com`
2. Click "Empezar a medir"
3. Crear cuenta → Nombre: "Daysu.vip"
4. Crear propiedad → Nombre: "Daysu.vip", zona horaria: Mexico City, moneda: MXN
5. Flujo de datos → Web → URL: `https://daysu.vip` → nombre: "Daysu.vip"
6. Copiar el **Measurement ID** (formato `G-XXXXXXXXXX`)

- [ ] **Step 2: Agregar env var en Vercel**

1. Panel Vercel → proyecto → Settings → Environment Variables
2. Agregar:
   - Key: `NEXT_PUBLIC_GA_ID`
   - Value: `G-XXXXXXXXXX` (el ID copiado en el paso anterior)
   - Environments: Production ✅, Preview ☐, Development ☐

- [ ] **Step 3: Hacer deploy**

```bash
git push origin master
```

Esperar que el deploy de Vercel complete.

- [ ] **Step 4: Verificar en producción**

Abrir `https://daysu.vip`, DevTools → Network → buscar `googletagmanager.com`. Debe aparecer la request de GA4.

También verificar en GA4: Informes → Tiempo real → debe mostrar 1 usuario activo.

---

### Task 8: Registrar sitemap en Google Search Console

> Esta tarea se hace una sola vez, post-deploy.

- [ ] **Step 1: Agregar propiedad en Search Console**

1. Ir a `search.google.com/search-console`
2. Click "Agregar propiedad" → seleccionar tipo "Dominio"
3. Ingresar `daysu.vip` → Continuar

- [ ] **Step 2: Verificar ownership via DNS**

Search Console mostrará un registro TXT (ej. `google-site-verification=XXXXXXX`).

En el panel DNS de tu dominio (Vercel Domains o donde esté apuntado), agregar:
- Tipo: `TXT`
- Host: `@` (o el dominio raíz)
- Valor: el string de verificación de Google

Luego click "Verificar" en Search Console. Puede tardar hasta 10 minutos.

- [ ] **Step 3: Enviar sitemap**

En Search Console → menú izquierdo → "Sitemaps" → ingresar `sitemap.xml` → "Enviar".

Debe aparecer como "Correcto" después de unos minutos.

- [ ] **Step 4: Vincular Search Console con GA4 (opcional pero recomendado)**

En GA4 → Admin → Vínculos de Search Console → Vincular → seleccionar la propiedad de Search Console de `daysu.vip`.

Esto permite ver datos de palabras clave de búsqueda directamente en GA4.
