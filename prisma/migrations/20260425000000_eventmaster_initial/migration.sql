-- EventMaster Pro — Migration inicial
-- Tablas en schema public (coexisten con otras apps en el mismo proyecto Supabase)

CREATE TYPE "AdminRole" AS ENUM ('superadmin', 'admin');
CREATE TYPE "BlockType" AS ENUM ('maintenance', 'logistics', 'transit', 'other');
CREATE TYPE "BookingStatus" AS ENUM ('draft', 'pending_payment', 'confirmed', 'in_progress', 'completed', 'expired', 'cancelled');
CREATE TYPE "NotificationType" AS ENUM ('hold_created', 'payment_received', 'hold_expired', 'force_cancelled');
CREATE TYPE "ChecklistPhase" AS ENUM ('salida', 'entrada');

CREATE TABLE "admin_users" (
  "id"          SERIAL PRIMARY KEY,
  "username"    VARCHAR(50)  UNIQUE NOT NULL,
  "email"       VARCHAR(200) UNIQUE NOT NULL,
  "password"    VARCHAR(200) NOT NULL,
  "full_name"   VARCHAR(200) NOT NULL,
  "suffix"      VARCHAR(8)   UNIQUE NOT NULL,
  "role"        "AdminRole"  NOT NULL DEFAULT 'admin',
  "is_active"   BOOLEAN      NOT NULL DEFAULT true,
  "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updated_at"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "created_by"  INTEGER
);

CREATE TABLE "asset_categories" (
  "id"          SERIAL PRIMARY KEY,
  "name"        VARCHAR(100) NOT NULL,
  "description" TEXT,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "assets" (
  "id"             SERIAL PRIMARY KEY,
  "category_id"    INTEGER      NOT NULL REFERENCES "asset_categories"("id"),
  "name"           VARCHAR(200) NOT NULL,
  "sku"            VARCHAR(50)  UNIQUE NOT NULL,
  "description"    TEXT,
  "total_units"    INTEGER      NOT NULL,
  "daily_rate"     DECIMAL(10,2) NOT NULL,
  "is_rentable"    BOOLEAN      NOT NULL DEFAULT true,
  "is_active"      BOOLEAN      NOT NULL DEFAULT true,
  "owner_admin_id" INTEGER      REFERENCES "admin_users"("id"),
  "owner_suffix"   VARCHAR(8),
  "created_at"     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updated_at"     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE "asset_components" (
  "id"              SERIAL PRIMARY KEY,
  "parent_asset_id" INTEGER NOT NULL REFERENCES "assets"("id"),
  "child_asset_id"  INTEGER NOT NULL REFERENCES "assets"("id"),
  "quantity"        INTEGER NOT NULL,
  "is_required"     BOOLEAN NOT NULL DEFAULT true,
  UNIQUE("parent_asset_id", "child_asset_id")
);

CREATE TABLE "staff_users" (
  "id"         SERIAL PRIMARY KEY,
  "full_name"  VARCHAR(200) NOT NULL,
  "email"      VARCHAR(200) UNIQUE NOT NULL,
  "phone"      VARCHAR(30),
  "is_active"  BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "staff_asset_assignments" (
  "id"          SERIAL PRIMARY KEY,
  "staff_id"    INTEGER NOT NULL REFERENCES "staff_users"("id"),
  "asset_id"    INTEGER NOT NULL REFERENCES "assets"("id"),
  "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("staff_id", "asset_id")
);

CREATE TABLE "availability_blocks" (
  "id"         SERIAL PRIMARY KEY,
  "asset_id"   INTEGER REFERENCES "assets"("id"),
  "block_type" "BlockType" NOT NULL,
  "start_at"   TIMESTAMPTZ NOT NULL,
  "end_at"     TIMESTAMPTZ NOT NULL,
  "notes"      TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "clients" (
  "id"           SERIAL PRIMARY KEY,
  "full_name"    VARCHAR(200) NOT NULL,
  "email"        VARCHAR(200) UNIQUE NOT NULL,
  "phone"        VARCHAR(30),
  "company"      VARCHAR(200),
  "tax_id"       VARCHAR(50),
  "crm_notes"    TEXT,
  "preferencias" TEXT,
  "referred_by"  VARCHAR(200),
  "notes"        TEXT,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "client_special_dates" (
  "id"         SERIAL PRIMARY KEY,
  "client_id"  INTEGER      NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
  "label"      VARCHAR(100) NOT NULL,
  "month"      INTEGER      NOT NULL,
  "day"        INTEGER      NOT NULL,
  "year"       INTEGER,
  "notes"      VARCHAR(300),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "bookings" (
  "id"                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "client_id"         INTEGER      NOT NULL REFERENCES "clients"("id"),
  "event_name"        VARCHAR(200) NOT NULL,
  "event_date"        DATE         NOT NULL,
  "setup_at"          TIMESTAMPTZ  NOT NULL,
  "teardown_at"       TIMESTAMPTZ  NOT NULL,
  "venue_address"     TEXT,
  "status"            "BookingStatus" NOT NULL DEFAULT 'pending_payment',
  "total_amount"      DECIMAL(10,2)   NOT NULL,
  "deposit_amount"    DECIMAL(10,2)   NOT NULL,
  "expires_at"        TIMESTAMPTZ,
  "stripe_session_id" VARCHAR UNIQUE,
  "notes"             TEXT,
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "booking_items" (
  "id"                     SERIAL  PRIMARY KEY,
  "booking_id"             UUID    NOT NULL REFERENCES "bookings"("id"),
  "asset_id"               INTEGER NOT NULL REFERENCES "assets"("id"),
  "quantity"               INTEGER NOT NULL,
  "unit_price"             DECIMAL(10,2) NOT NULL,
  "is_auto_blocked"        BOOLEAN NOT NULL DEFAULT false,
  "parent_booking_item_id" INTEGER
);

CREATE TABLE "admin_notifications" (
  "id"         SERIAL PRIMARY KEY,
  "booking_id" UUID        NOT NULL REFERENCES "bookings"("id"),
  "type"       "NotificationType" NOT NULL,
  "message"    TEXT        NOT NULL,
  "is_read"    BOOLEAN     NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "upsell_rules" (
  "id"                 SERIAL PRIMARY KEY,
  "source_asset_id"    INTEGER NOT NULL REFERENCES "assets"("id"),
  "suggested_asset_id" INTEGER NOT NULL REFERENCES "assets"("id"),
  "discount_percent"   DECIMAL(5,2) NOT NULL,
  "label"              VARCHAR(200),
  "is_active"          BOOLEAN NOT NULL DEFAULT true,
  "created_at"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("source_asset_id", "suggested_asset_id")
);

CREATE TABLE "event_checklists" (
  "id"           SERIAL PRIMARY KEY,
  "booking_id"   UUID           NOT NULL REFERENCES "bookings"("id"),
  "phase"        "ChecklistPhase" NOT NULL,
  "completed_at" TIMESTAMPTZ,
  "notes"        TEXT,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("booking_id", "phase")
);

CREATE TABLE "checklist_items" (
  "id"           SERIAL PRIMARY KEY,
  "checklist_id" INTEGER      NOT NULL REFERENCES "event_checklists"("id") ON DELETE CASCADE,
  "label"        VARCHAR(300) NOT NULL,
  "category"     VARCHAR(50)  NOT NULL DEFAULT 'equipo',
  "checked"      BOOLEAN      NOT NULL DEFAULT false,
  "checked_at"   TIMESTAMPTZ,
  "sort_order"   INTEGER      NOT NULL DEFAULT 0
);

CREATE TABLE "system_settings" (
  "key"        VARCHAR(100) PRIMARY KEY,
  "value"      VARCHAR(500) NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed: configuración inicial
INSERT INTO "system_settings" ("key", "value") VALUES
  ('payment_hold_hours', '48'),
  ('deposit_percent',    '30'),
  ('max_advance_days',   '365'),
  ('company_name',       'Aura Producciones'),
  ('company_phone',      '4929496372'),
  ('company_city',       'Zacatecas');

-- Seed: categorías
INSERT INTO "asset_categories" ("name", "description") VALUES
  ('Paquetes',        'Paquetes completos de producción para eventos'),
  ('Sonido',          'Equipos de audio y sonido profesional'),
  ('Iluminación',     'Equipos de iluminación LED y efectos especiales'),
  ('Fotografía',      'Cabinas fotográficas y accesorios'),
  ('Entretenimiento', 'Shows, efectos especiales y entretenimiento'),
  ('Mobiliario',      'Mesas, sillas, tarimas y mobiliario de evento'),
  ('Staff',           'Personal técnico y de servicio');

-- Seed: paquetes (SKUs usados por HomeClient)
INSERT INTO "assets" ("category_id", "name", "sku", "description", "total_units", "daily_rate", "is_rentable", "is_active") VALUES
  (1, 'Paquete Básico',   'PKG-BASICO',
   'Cabina fotográfica inflable LED con props y galería digital. Servicio de 4 a 6 horas.',
   1, 4500.00, true, true),
  (1, 'Paquete Mediano',  'PKG-MEDIANO',
   'Cabina fotográfica inflable + carrito de shots iluminados RGB. Ambientación completa.',
   1, 7500.00, true, true),
  (1, 'Paquete Premium',  'PKG-PREMIUM',
   'Cabina + shots iluminados + sistema de sonido e iluminación profesional con DJ.',
   1, 12000.00, true, true),
  (1, 'Master VIP',       'PKG-MASTER-VIP',
   'Todos los servicios: cabina, shots, sonido, iluminación, DJ y efectos especiales.',
   1, 18000.00, true, true),
  (1, 'Paquete Diamante', 'PKG-DIAMANTE',
   'Experiencia de lujo: show robot LED, vals en las nubes, pirotecnia fría y más.',
   1, 25000.00, true, true),
  (1, 'Snack Tatoo',      'PKG-SNACK-TATOO',
   'Carrito de shots iluminados + tatuajes temporales + snacks para tus invitados.',
   1, 6000.00, true, true);
