# Wedding Planner — Diseño y Especificación
**Fecha:** 2026-05-12
**Proyecto:** EventMaster Pro — Aura Producciones

---

## Objetivo

Agregar una sección pública `/wedding-planner` al sitio de Aura Producciones para **vender el servicio de planeación integral de eventos** (bodas, XV años, fiestas, eventos corporativos, etc.). El visitante llega, se convierte en prospecto enviando un formulario de contacto, y el Wedding Planner se encarga de todo desde ese punto en adelante.

No es un portal de cliente ni un módulo interno de logística — es una landing page de ventas con captura de leads.

---

## Alcance

### Página pública `/wedding-planner`

1. **Hero (pantalla completa)**
   - Foto de evento de fondo con overlay oscuro
   - Texto estático: "Planificamos tu"
   - Texto animado (typewriter/fade) que cicla entre tipos de evento configurables: `Boda`, `XV Años`, `Fiesta`, `Evento Corporativo`, `Graduación`, etc.
   - Texto estático: "desde cero. Tú solo disfruta."
   - CTA: botón "Quiero planificar mi evento" que hace scroll al formulario

2. **Galería de eventos** (grid masonry o 3 columnas)
   - Fotos de eventos reales realizados, muy visual
   - Las imágenes se seleccionan desde la galería existente de Vercel Blob
   - Admin elige cuáles aparecen aquí desde el panel de configuración

3. **¿Cómo funciona?** (3 pasos)
   - Paso 1: Nos contactas
   - Paso 2: Planificamos todo
   - Paso 3: Tú solo disfrutas
   - Textos editables desde admin

4. **Testimonios** (carousel o lista)
   - 2-3 reseñas de clientes reales
   - Nombre, tipo de evento, texto — editables desde admin

5. **Formulario de contacto** (anchor desde el hero)
   - Nombre completo
   - Email
   - Teléfono
   - Tipo de evento (selector: Boda, XV Años, Fiesta, Corporativo, Otro)
   - Fecha estimada (date picker opcional)
   - Número de invitados aproximado
   - Mensaje / detalles adicionales
   - Botón "Enviar solicitud"
   - Al enviar: mensaje de confirmación en pantalla + registro en BD como `WeddingLead`

---

### Panel Admin `/admin/wedding-planner`

Dos pestañas: **Leads** y **Configuración**.

#### Pestaña Leads

- Tabla con columnas: Nombre · Tipo evento · Fecha evento · Invitados · Estado · Fecha recibido
- Filtro por estado
- Click en fila → drawer lateral con:
  - Todos los datos del formulario
  - Campo de notas internas del admin
  - Selector de estado
  - Botón "Crear cliente en CRM" (pre-llena `Client` con nombre, email, teléfono)

**Estados de lead:**
```
new → contacted → negotiating → confirmed → discarded
```

#### Pestaña Configuración

- **Tipos de evento** (texto animado): lista editable con chips. Default: Boda, XV Años, Fiesta, Evento Corporativo, Graduación
- **Fotos de la sección**: selector multi-imagen desde la galería existente (Vercel Blob)
- **Testimonios**: agregar / editar / eliminar. Campos: nombre, tipo de evento, texto
- **Texto del hero**: subtítulo editable
- **Textos de los 3 pasos**: editables

---

## Modelo de datos

### Tabla nueva: `wedding_leads`

```prisma
model WeddingLead {
  id           Int               @id @default(autoincrement())
  name         String            @db.VarChar(200)
  email        String            @db.VarChar(200)
  phone        String?           @db.VarChar(30)
  eventType    String            @map("event_type") @db.VarChar(100)
  eventDate    DateTime?         @map("event_date") @db.Date
  guestCount   Int?              @map("guest_count")
  budget       String?           @db.VarChar(100)  // rango libre: "50k-80k"
  message      String?           @db.Text
  status       WeddingLeadStatus @default(new)
  adminNotes   String?           @map("admin_notes") @db.Text
  clientId     Int?              @map("client_id")  // FK opcional, al convertir a cliente
  createdAt    DateTime          @default(now()) @map("created_at")
  updatedAt    DateTime          @updatedAt @map("updated_at")

  client Client? @relation(fields: [clientId], references: [id])

  @@map("wedding_leads")
}

// Relación inversa a agregar en el modelo Client existente:
// weddingLeads WeddingLead[]

enum WeddingLeadStatus {
  new
  contacted
  negotiating
  confirmed
  discarded
}
```

### system_settings — claves nuevas (JSON)

| Clave | Tipo | Descripción |
|---|---|---|
| `wp_event_types` | `string[]` | Tipos de evento para el texto animado |
| `wp_gallery_images` | `string[]` | Filenames del path `galeria/processed/` en Vercel Blob |
| `wp_testimonials` | `{name,eventType,text}[]` | Reseñas |
| `wp_hero_subtitle` | `string` | Subtítulo del hero |
| `wp_steps` | `{title,desc}[]` | Textos de los 3 pasos |

Prefijo `wp_` para agrupar todas las claves del Wedding Planner.

---

## API

| Ruta | Método | Descripción |
|---|---|---|
| `/api/wedding-leads` | POST | Recibe formulario público, crea `WeddingLead` |
| `/api/admin/wedding-leads` | GET | Lista leads con filtros (auth requerida) |
| `/api/admin/wedding-leads/[id]` | GET, PATCH | Detalle y actualización (estado, notas, clientId) |
| `/api/admin/wedding-leads/[id]/convert` | POST | Crea `Client` a partir del lead |
| `/api/admin/wedding-planner/settings` | GET, PATCH | Lee y actualiza claves `wp_*` en system_settings |

Rate limiting en `POST /api/wedding-leads` (5 req / 10 min por IP).

---

## Rutas Next.js

| Ruta | Tipo | Descripción |
|---|---|---|
| `/wedding-planner` | Página pública | Landing page completa |
| `/admin/wedding-planner` | Página admin | Leads + Configuración |

`/wedding-planner` usa `revalidate: 300` (5 min) para servir contenido cacheado — la configuración cambia poco.

---

## Componentes principales

- `WeddingHero` — hero con foto, texto animado (fade cross-dissolve entre tipos de evento, intervalo 2.5s), botón CTA
- `WeddingGallery` — grid de fotos seleccionadas
- `WeddingSteps` — los 3 pasos
- `WeddingTestimonials` — carousel de reseñas
- `WeddingForm` — formulario controlado con validación inline (patrón del BookingWizard)
- `WeddingLeadsTable` — tabla admin con filtro por estado
- `WeddingLeadDrawer` — drawer lateral de detalle/edición
- `WeddingPlannerConfig` — formulario de configuración del admin

---

## Fuera de alcance (fase 2)

- Notificaciones por email al recibir un lead
- Integración con WhatsApp automático al lead
- Seguimiento de múltiples contactos por lead
- Dashboard de conversión de leads

---

## Dependencias

- Galería existente (Vercel Blob) — reutilizada para las fotos
- CRM de clientes (`Client`) — conversión de lead a cliente
- `system_settings` — almacenamiento de configuración
- `rate-limit.ts` — rate limiting en formulario público
- Patrón auth admin — rutas `/api/admin/*` ya protegidas por middleware
