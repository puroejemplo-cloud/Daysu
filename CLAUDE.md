# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**EventMaster Pro** — sistema integral de gestión de eventos para **Aura Producciones**.
Gestiona inventario con relaciones Padre→Hijo (BOM), disponibilidad en tiempo real, reservas con hold temporal y pago de apartado vía Stripe, CRM de clientes, checklists de logística y reglas de upsell.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16.2.4 (App Router) |
| Lenguaje | TypeScript 5 |
| UI | React 19 |
| Base de datos | PostgreSQL 16 |
| ORM | Prisma 7 (adapter-pg) |
| Auth | NextAuth v5 (beta.31) — Credentials + JWT |
| Pagos | Stripe 22 |
| Estilos | Tailwind CSS 4 |
| Iconos | lucide-react |
| Fechas | date-fns + react-day-picker |

## Commands

```bash
# Desarrollo
npm run dev               # Servidor local en http://localhost:3000
docker compose up -d      # Levanta PostgreSQL local (eventmaster_db, puerto 5432)

# Base de datos
npm run db:generate       # Regenera el cliente Prisma tras cambios al schema
npm run db:migrate        # Crea y aplica una nueva migración (dev)
npm run db:migrate:deploy # Aplica migraciones en producción
npm run db:push           # Push directo sin crear archivo de migración (prototipado)
npm run db:seed           # Inserta datos iniciales (categorías + system_settings)
npm run db:seed:admin     # Crea la cuenta superadmin inicial (ejecutar una sola vez)
npm run db:studio         # Abre Prisma Studio en el navegador

# Build y calidad
npm run build             # Build de producción (incluye prisma generate automáticamente)
npx tsc --noEmit          # Type-check sin compilar
npm run lint              # ESLint

# Scripts operativos (uno a la vez, no son parte del flujo normal)
# scripts/*.ts — tareas puntuales: assign-owners, create-users, add-day-products, etc.

# No hay suite de tests en este proyecto
```

## Variables de entorno

Copiar `.env.example` a `.env`:

```
DATABASE_URL="postgresql://eventmaster:eventmaster123@localhost:5432/eventmaster_pro?schema=public"
AUTH_SECRET="cadena-aleatoria-larga"           # NextAuth JWT signing key
CRON_SECRET="cadena-aleatoria"                 # Protege el endpoint cron en producción
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXTAUTH_URL="http://localhost:3000"
```

En producción con **Neon** (o cualquier pooler), `prisma.config.ts` prioriza estas variables para migraciones (usa conexión directa para evitar timeouts del pooler):

```
DATABASE_URL_UNPOOLED="..."    # conexión directa — preferida para migraciones
POSTGRES_URL_NON_POOLING="..."  # alias alternativo (Vercel Neon integration)
POSTGRES_URL="..."              # pooler — usado en runtime si no hay directa
```

## Arquitectura

### Rutas de la aplicación

| Ruta | Acceso | Descripción |
|---|---|---|
| `/` | Público | Homepage con paquetes (revalidate: 60s) |
| `/catalogo` | Público | Catálogo de activos |
| `/reservar` | Público | Wizard de reserva multi-paso |
| `/reserva/[id]` | Público (UUID) | Confirmación de reserva individual |
| `/login` | Público | Login de administradores |
| `/admin` | admin / superadmin | Dashboard principal |
| `/admin/productos` | admin / superadmin | Gestión de activos y BOM |
| `/admin/clientes` | admin / superadmin | CRM de clientes |
| `/admin/clientes/[id]` | admin / superadmin | Perfil de cliente con historial |
| `/admin/recordatorios` | admin / superadmin | Fechas especiales de clientes |
| `/admin/checklists` | admin / superadmin | Lista de checklists por reserva |
| `/admin/checklists/[bookingId]` | admin / superadmin | Checklist de salida/entrada |
| `/admin/calendario` | admin / superadmin | Vista de reservas activas en calendario |
| `/admin/upsell` | admin / superadmin | Gestión de reglas de upsell |
| `/admin/galeria` | admin / superadmin | Imágenes de galería pública |
| `/admin/ventas/nueva` | admin / superadmin | Registro de venta manual (sin Stripe) |
| `/admin/configuracion` | admin / superadmin | Edición de `system_settings` (ej: `payment_hold_hours`) |
| `/superadmin/admins` | superadmin | Gestión de cuentas de administrador |

El middleware (`src/middleware.ts`) usa `authConfig` (edge-safe, sin bcrypt/Prisma). Bloquea `/admin/:path*` y `/superadmin/:path*`; la callback `authorized` en `auth.config.ts` rechaza a no-superadmin que intenten acceder a `/superadmin/`.

### Flujo de reservas (regla de negocio crítica)

```
draft → pending_payment → confirmed → in_progress → completed
                       ↘ expired (job automático cada 30 min)
                       ↘ cancelled (admin fuerza cierre)
```

- `pending_payment` bloquea stock durante la ventana de pago (`payment_hold_hours` en `system_settings`, default 48 h).
- El stock solo se libera cuando el estado es `expired` o `cancelled`.
- La query de disponibilidad excluye `draft`, `expired` y `cancelled`.
- Al crear una reserva, Stripe genera una sesión de checkout (`/api/checkout/[bookingId]`); el webhook `/api/webhooks/stripe` confirma el pago y avanza el estado a `confirmed`.

### Flujo de pago Stripe

```
POST /api/bookings → crea booking en draft/pending_payment
POST /api/checkout/[bookingId] → crea Stripe Checkout Session (depositAmount = 30 %)
  → redirige al usuario a Stripe
Stripe webhook POST /api/webhooks/stripe → confirma pago → booking.status = confirmed
```

### Estructura de API (`src/app/api/`)

| Route | Métodos | Descripción |
|---|---|---|
| `/api/assets` | GET, POST | Catálogo (filtros: `?category_id=`, `?rentable=true`) |
| `/api/assets/[id]` | GET, PUT, DELETE | Activo individual (DELETE = baja lógica) |
| `/api/assets/[id]/components` | POST | Añade hijo BOM al activo |
| `/api/asset-categories` | GET, POST | CRUD categorías |
| `/api/asset-components` | GET, POST, DELETE | BOM padre→hijo |
| `/api/admin/assets` | GET, POST | Assets desde panel admin |
| `/api/admin/assets/[id]` | GET, PUT, DELETE | Admin asset detail |
| `/api/admin/assets/[id]/image` | POST, DELETE | Sube o elimina foto de galería (guardada en `public/productos/`, ownership verificado) |
| `/api/admin/assets/[id]/components` | GET, POST, DELETE | Gestión BOM desde panel admin (con auth + check ownership) |
| `/api/admin/bookings` | GET | Listado de reservas con filtros |
| `/api/admin/galeria` | GET, POST, PATCH, PUT, DELETE | Galería pública: GET lista, POST procesa blur, PATCH sube nueva imagen, PUT reprocesa todas, DELETE elimina |
| `/api/admin/galeria/carousel` | GET, PUT | Lee y guarda la selección de imágenes para el carrusel de la homepage |
| `/api/admin/settings` | GET, PATCH | Lee y actualiza `system_settings` (clave `payment_hold_hours`, etc.) |
| `/api/availability` | GET | Stock disponible (`?start=ISO&end=ISO&asset_id=`) |
| `/api/availability-blocks` | GET, POST | Bloqueos manuales del calendario |
| `/api/bookings` | GET, POST | Lista y crea reservas con hold + BOM expansion |
| `/api/bookings/[id]` | GET, PUT | Detalle y edición de reserva |
| `/api/bookings/[id]/confirm` | POST | Marca pago recibido → `confirmed` |
| `/api/bookings/[id]/cancel` | POST | Admin cancela manualmente |
| `/api/checkout/[bookingId]` | POST | Inicia sesión Stripe Checkout |
| `/api/webhooks/stripe` | POST | Webhook Stripe → confirma pago |
| `/api/clients` | GET, POST | CRM: lista y crea clientes |
| `/api/clients/[id]` | GET | Perfil de cliente |
| `/api/clients/upcoming` | GET | Próximas reservas por cliente |
| `/api/clients/[id]/special-dates` | GET, POST | Fechas especiales (cumpleaños, aniversarios) |
| `/api/clients/[id]/special-dates/[dateId]` | GET, DELETE | Fecha especial individual |
| `/api/checklists` | GET, POST | Checklists de logística (auto-generados) |
| `/api/checklists/[id]/complete` | PUT | Marca fase completada |
| `/api/checklists/[id]/items/[itemId]` | PUT | Toggle ítem de checklist |
| `/api/upsell-rules` | GET, POST | Reglas de upsell |
| `/api/upsell-rules/[id]` | GET, PUT, DELETE | Regla individual |
| `/api/upsell` | GET | Sugerencias para un activo (`?assetId=`) |
| `/api/admin-users` | GET, POST | Crear/listar cuentas de admin |
| `/api/admin-users/[id]` | GET, PUT | Detalle de admin |
| `/api/cron/expire-holds` | GET | Job de expiración (requiere `x-cron-secret` en prod) |
| `/api/auth/[...nextauth]` | * | NextAuth handlers |

### Helpers clave (`src/lib/`)

- `prisma.ts` — singleton del cliente con `PrismaPg` adapter (Prisma 7).
- `api.ts` — helpers `ok()` / `err()` para respuestas JSON consistentes.
- `availability.ts` — `getAvailability(start, end, assetId?)` — única fuente de verdad del stock disponible.
- `bookings.ts` — `expandBomItems()` expande BOM; `getHoldHours()` lee `system_settings`; `assertAvailability()` valida stock.
- `stripe.ts` — instancia Stripe con API version `"2026-04-22.dahlia"`.
- `checklist.ts` — `getOrCreateChecklist(bookingId, phase)` auto-genera items de equipo y tareas.
- `rate-limit.ts` — `rateLimit(req, limit, windowMs?)` — rate limiting en memoria por IP+ruta; devuelve `Response | null`.
- `product-tiers.ts` — lógica de pricing tiers (`"hourly"` | `"capacity"`). `getPricingTiers(sku, dbConfig?)` prioriza BD; si no hay configuración usa fallbacks hardcodeados por SKU. `getTierLabel()` genera la etiqueta del resumen de precio.

### Tipos de activo (`Asset.assetType`)

- `"package"` — paquete completo con precio fijo o tiers; tiene hijos BOM.
- `"product"` — servicio o producto individual rentable.
- `"component"` — componente no rentable de forma independiente (`isRentable=false`); solo puede ir como hijo BOM.

### BOM (Bill of Materials)

- Un activo `isRentable=true` puede tener N componentes hijos (`isRentable=false`).
- Solo un nivel de profundidad (plano, sin recursividad).
- Al crear una reserva, `expandBomItems()` agrega los hijos como `booking_items` con `isAutoBlocked=true`.
- `AssetComponent.overridePrice` permite fijar un precio específico por componente dentro del paquete (lo usa el wizard de pricing tiers para paquetes con tiers de capacidad u horas).

### Subida de imágenes

- Las imágenes de activos se guardan localmente en `public/productos/` (nombre: `<sku-lowercase>-<timestamp>.<ext>`).
- Las imágenes de paquetes (fotos adicionales para la homepage) se guardan en `public/paquetes/`.
- La galería pública usa **Vercel Blob** como almacenamiento persistente (requiere `BLOB_READ_WRITE_TOKEN`):
  - `galeria/originals/{filename}` — originales subidos por el admin.
  - `galeria/processed/{filename.webp}` — versiones WebP procesadas con `sharp` (máx. 1400 px).
  - `galeria/config/blur.json` — regiones de blur por imagen (coordenadas relativas 0–1).
  - `galeria/config/order.json` — orden de presentación (más recientes primero).
  - `galeria/config/carousel.json` — filenames seleccionados para el carrusel de la homepage.
- `public/Galeria/` y `public/galeria/` ya no se usan para nuevas subidas; son restos de la arquitectura anterior (solo-lectura en Vercel).

### Módulos de negocio adicionales

**CRM de clientes** (`/admin/clientes`): perfil con historial de reservas, notas, `preferencias`, `referredBy`. `ClientSpecialDate` almacena mes/día para recordatorios (cumpleaños, aniversarios) visibles en `/admin/recordatorios`.

**Checklists de logística**: modelo `EventChecklist` con dos fases (`salida` | `entrada`). Los ítems son de tipo `equipo` o `tarea`. El admin los gestiona en `/admin/checklists/[bookingId]`.

**Upsell**: `UpsellRule` vincula `sourceAssetId → suggestedAssetId` con `discountPercent`. Se muestran en `UpsellBanner` durante el flujo de reserva.

**Staff**: `StaffUser` y `StaffAssetAssignment` vinculan personal a activos específicos (sin roles propios).

**Notificaciones**: `AdminNotification` registra eventos del ciclo de reserva (`hold_created`, `payment_received`, `hold_expired`, `force_cancelled`).

**PWA**: La app es instalable. `public/manifest.json` y `public/sw.js` habilitan la experiencia PWA. `src/components/ui/PWARegister.tsx` registra el service worker en el cliente.

### Admin UI — convenciones de layout

Todas las páginas del panel admin siguen el mismo esqueleto para mantener espaciado y tipografía uniformes. Usar estas clases de `globals.css`:

```tsx
<div className="admin-page">           {/* max-width 80rem, padding responsivo */}
  <header className="admin-page-header">  {/* margin-bottom 2.5rem */}
    <p className="admin-label">Sección</p>         {/* etiqueta pequeña en mayúsculas */}
    <h1 className="admin-page-title">Título</h1>  {/* 1.625rem, font-weight 500 */}
    <p className="admin-page-desc">Descripción.</p>
  </header>
  {/* contenido */}
</div>
```

Clases auxiliares: `admin-surface` (card oscura con borde sutil), `admin-divider` (separador horizontal), `admin-badge` (pill de estado).

El token de color de acento es `var(--gold)` (`#c9a84c` / `#D4AF37`). Nunca usar colores de acento hardcodeados; usar la variable CSS.

### Prisma 7 — diferencias importantes

- La URL de BD **no va** en `schema.prisma`. Va en `prisma.config.ts` (para migraciones) y en el constructor `PrismaPg` (para queries en runtime).
- Enums e imports del cliente: `import { ... } from "@/generated/prisma"`.
- Tras cualquier cambio al schema ejecutar `npm run db:generate`.

### Autenticación (NextAuth v5)

- `src/auth.ts` — configuración principal con Credentials provider (bcrypt). Exporta `{ handlers, signIn, signOut, auth }`.
- `src/auth.config.ts` — configuración edge-safe (sin bcrypt/Prisma). Contiene callbacks JWT y session que propagan `username`, `suffix` y `role` al token.
- `AdminUser.role` puede ser `admin` o `superadmin`. El campo `suffix` identifica qué activos "posee" cada admin.
- El tipo de sesión se extiende en `src/types/next-auth.d.ts`.

### Notas de desarrollo

- `next.config.ts` incluye `allowedDevOrigins: ["192.168.100.98"]` para acceder al servidor de desarrollo desde la red local.
- Los imports de tipos Prisma siempre usan `"@/generated/prisma"`, no `"@prisma/client"`.
