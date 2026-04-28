-- EventMaster Pro — Schema completo sincronizado con schema.prisma actual

CREATE TYPE "AdminRole"        AS ENUM ('superadmin', 'admin');
CREATE TYPE "BlockType"        AS ENUM ('maintenance', 'logistics', 'transit', 'other');
CREATE TYPE "BookingStatus"    AS ENUM ('draft', 'pending_payment', 'confirmed', 'in_progress', 'completed', 'expired', 'cancelled');
CREATE TYPE "NotificationType" AS ENUM ('hold_created', 'payment_received', 'hold_expired', 'force_cancelled');
CREATE TYPE "ChecklistPhase"   AS ENUM ('salida', 'entrada');

CREATE TABLE "admin_users" (
  "id"          SERIAL          NOT NULL,
  "username"    VARCHAR(50)     NOT NULL,
  "email"       VARCHAR(200)    NOT NULL,
  "password"    VARCHAR(200)    NOT NULL,
  "full_name"   VARCHAR(200)    NOT NULL,
  "suffix"      VARCHAR(8)      NOT NULL,
  "role"        "AdminRole"     NOT NULL DEFAULT 'admin',
  "is_active"   BOOLEAN         NOT NULL DEFAULT true,
  "created_at"  TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3)    NOT NULL,
  "created_by"  INTEGER,
  CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "asset_categories" (
  "id"          SERIAL          NOT NULL,
  "name"        VARCHAR(100)    NOT NULL,
  "description" TEXT,
  "created_at"  TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "asset_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "assets" (
  "id"              SERIAL          NOT NULL,
  "category_id"     INTEGER         NOT NULL,
  "name"            VARCHAR(200)    NOT NULL,
  "sku"             VARCHAR(50)     NOT NULL,
  "description"     TEXT,
  "total_units"     INTEGER         NOT NULL,
  "daily_rate"      DECIMAL(10,2)   NOT NULL,
  "original_price"  DECIMAL(10,2),
  "max_guests"      INTEGER,
  "asset_type"      VARCHAR(20)     NOT NULL DEFAULT 'product',
  "is_rentable"     BOOLEAN         NOT NULL DEFAULT true,
  "is_active"       BOOLEAN         NOT NULL DEFAULT true,
  "pricing_tiers"   JSONB,
  "image_url"       VARCHAR(500),
  "image_gallery"   JSONB,
  "owner_admin_id"  INTEGER,
  "owner_suffix"    VARCHAR(8),
  "created_at"      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3)    NOT NULL,
  CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "asset_components" (
  "id"               SERIAL        NOT NULL,
  "parent_asset_id"  INTEGER       NOT NULL,
  "child_asset_id"   INTEGER       NOT NULL,
  "quantity"         INTEGER       NOT NULL,
  "is_required"      BOOLEAN       NOT NULL DEFAULT true,
  "override_price"   DECIMAL(10,2),
  CONSTRAINT "asset_components_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "staff_users" (
  "id"          SERIAL       NOT NULL,
  "full_name"   VARCHAR(200) NOT NULL,
  "email"       VARCHAR(200) NOT NULL,
  "phone"       VARCHAR(30),
  "is_active"   BOOLEAN      NOT NULL DEFAULT true,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "staff_users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "staff_asset_assignments" (
  "id"          SERIAL       NOT NULL,
  "staff_id"    INTEGER      NOT NULL,
  "asset_id"    INTEGER      NOT NULL,
  "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "staff_asset_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "availability_blocks" (
  "id"          SERIAL       NOT NULL,
  "asset_id"    INTEGER,
  "block_type"  "BlockType"  NOT NULL,
  "start_at"    TIMESTAMP(3) NOT NULL,
  "end_at"      TIMESTAMP(3) NOT NULL,
  "notes"       TEXT,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "availability_blocks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "clients" (
  "id"           SERIAL       NOT NULL,
  "full_name"    VARCHAR(200) NOT NULL,
  "email"        VARCHAR(200) NOT NULL,
  "phone"        VARCHAR(30),
  "company"      VARCHAR(200),
  "tax_id"       VARCHAR(50),
  "crm_notes"    TEXT,
  "preferencias" TEXT,
  "referred_by"  VARCHAR(200),
  "notes"        TEXT,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "client_special_dates" (
  "id"          SERIAL       NOT NULL,
  "client_id"   INTEGER      NOT NULL,
  "label"       VARCHAR(100) NOT NULL,
  "month"       INTEGER      NOT NULL,
  "day"         INTEGER      NOT NULL,
  "year"        INTEGER,
  "notes"       VARCHAR(300),
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "client_special_dates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bookings" (
  "id"                TEXT          NOT NULL,
  "client_id"         INTEGER       NOT NULL,
  "event_name"        VARCHAR(200)  NOT NULL,
  "event_date"        DATE          NOT NULL,
  "setup_at"          TIMESTAMP(3)  NOT NULL,
  "teardown_at"       TIMESTAMP(3)  NOT NULL,
  "venue_address"     TEXT,
  "status"            "BookingStatus" NOT NULL DEFAULT 'pending_payment',
  "total_amount"      DECIMAL(10,2) NOT NULL,
  "deposit_amount"    DECIMAL(10,2) NOT NULL,
  "expires_at"        TIMESTAMP(3),
  "stripe_session_id" TEXT,
  "notes"             TEXT,
  "created_at"        TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"        TIMESTAMP(3)  NOT NULL,
  CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "booking_items" (
  "id"                    SERIAL        NOT NULL,
  "booking_id"            TEXT          NOT NULL,
  "asset_id"              INTEGER       NOT NULL,
  "quantity"              INTEGER       NOT NULL,
  "unit_price"            DECIMAL(10,2) NOT NULL,
  "is_auto_blocked"       BOOLEAN       NOT NULL DEFAULT false,
  "parent_booking_item_id" INTEGER,
  CONSTRAINT "booking_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admin_notifications" (
  "id"          SERIAL             NOT NULL,
  "booking_id"  TEXT               NOT NULL,
  "type"        "NotificationType" NOT NULL,
  "message"     TEXT               NOT NULL,
  "is_read"     BOOLEAN            NOT NULL DEFAULT false,
  "created_at"  TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "upsell_rules" (
  "id"                  SERIAL        NOT NULL,
  "source_asset_id"     INTEGER       NOT NULL,
  "suggested_asset_id"  INTEGER       NOT NULL,
  "discount_percent"    DECIMAL(5,2)  NOT NULL,
  "label"               VARCHAR(200),
  "is_active"           BOOLEAN       NOT NULL DEFAULT true,
  "created_at"          TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "upsell_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "event_checklists" (
  "id"           SERIAL           NOT NULL,
  "booking_id"   TEXT             NOT NULL,
  "phase"        "ChecklistPhase" NOT NULL,
  "completed_at" TIMESTAMP(3),
  "notes"        TEXT,
  "created_at"   TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMP(3)     NOT NULL,
  CONSTRAINT "event_checklists_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "checklist_items" (
  "id"           SERIAL       NOT NULL,
  "checklist_id" INTEGER      NOT NULL,
  "label"        VARCHAR(300) NOT NULL,
  "category"     VARCHAR(50)  NOT NULL DEFAULT 'equipo',
  "checked"      BOOLEAN      NOT NULL DEFAULT false,
  "checked_at"   TIMESTAMP(3),
  "sort_order"   INTEGER      NOT NULL DEFAULT 0,
  CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "system_settings" (
  "key"        VARCHAR(100) NOT NULL,
  "value"      VARCHAR(500) NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- Unique indexes
CREATE UNIQUE INDEX "admin_users_username_key"  ON "admin_users"("username");
CREATE UNIQUE INDEX "admin_users_email_key"     ON "admin_users"("email");
CREATE UNIQUE INDEX "admin_users_suffix_key"    ON "admin_users"("suffix");
CREATE UNIQUE INDEX "assets_sku_key"            ON "assets"("sku");
CREATE UNIQUE INDEX "asset_components_parent_asset_id_child_asset_id_key" ON "asset_components"("parent_asset_id", "child_asset_id");
CREATE UNIQUE INDEX "staff_users_email_key"     ON "staff_users"("email");
CREATE UNIQUE INDEX "staff_asset_assignments_staff_id_asset_id_key" ON "staff_asset_assignments"("staff_id", "asset_id");
CREATE UNIQUE INDEX "clients_email_key"         ON "clients"("email");
CREATE UNIQUE INDEX "bookings_stripe_session_id_key" ON "bookings"("stripe_session_id");
CREATE UNIQUE INDEX "upsell_rules_source_asset_id_suggested_asset_id_key" ON "upsell_rules"("source_asset_id", "suggested_asset_id");
CREATE UNIQUE INDEX "event_checklists_booking_id_phase_key" ON "event_checklists"("booking_id", "phase");

-- Foreign keys
ALTER TABLE "assets"                  ADD CONSTRAINT "assets_category_id_fkey"                  FOREIGN KEY ("category_id")      REFERENCES "asset_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "assets"                  ADD CONSTRAINT "assets_owner_admin_id_fkey"               FOREIGN KEY ("owner_admin_id")   REFERENCES "admin_users"("id")      ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "asset_components"        ADD CONSTRAINT "asset_components_parent_asset_id_fkey"    FOREIGN KEY ("parent_asset_id")  REFERENCES "assets"("id")           ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "asset_components"        ADD CONSTRAINT "asset_components_child_asset_id_fkey"     FOREIGN KEY ("child_asset_id")   REFERENCES "assets"("id")           ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "staff_asset_assignments" ADD CONSTRAINT "staff_asset_assignments_staff_id_fkey"    FOREIGN KEY ("staff_id")         REFERENCES "staff_users"("id")      ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "staff_asset_assignments" ADD CONSTRAINT "staff_asset_assignments_asset_id_fkey"    FOREIGN KEY ("asset_id")         REFERENCES "assets"("id")           ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "availability_blocks"     ADD CONSTRAINT "availability_blocks_asset_id_fkey"        FOREIGN KEY ("asset_id")         REFERENCES "assets"("id")           ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "client_special_dates"    ADD CONSTRAINT "client_special_dates_client_id_fkey"      FOREIGN KEY ("client_id")        REFERENCES "clients"("id")          ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "bookings"                ADD CONSTRAINT "bookings_client_id_fkey"                  FOREIGN KEY ("client_id")        REFERENCES "clients"("id")          ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "booking_items"           ADD CONSTRAINT "booking_items_booking_id_fkey"            FOREIGN KEY ("booking_id")       REFERENCES "bookings"("id")         ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "booking_items"           ADD CONSTRAINT "booking_items_asset_id_fkey"              FOREIGN KEY ("asset_id")         REFERENCES "assets"("id")           ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "admin_notifications"     ADD CONSTRAINT "admin_notifications_booking_id_fkey"      FOREIGN KEY ("booking_id")       REFERENCES "bookings"("id")         ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "upsell_rules"            ADD CONSTRAINT "upsell_rules_source_asset_id_fkey"        FOREIGN KEY ("source_asset_id")  REFERENCES "assets"("id")           ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "upsell_rules"            ADD CONSTRAINT "upsell_rules_suggested_asset_id_fkey"     FOREIGN KEY ("suggested_asset_id") REFERENCES "assets"("id")         ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "event_checklists"        ADD CONSTRAINT "event_checklists_booking_id_fkey"         FOREIGN KEY ("booking_id")       REFERENCES "bookings"("id")         ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "checklist_items"         ADD CONSTRAINT "checklist_items_checklist_id_fkey"        FOREIGN KEY ("checklist_id")     REFERENCES "event_checklists"("id") ON DELETE CASCADE  ON UPDATE CASCADE;
