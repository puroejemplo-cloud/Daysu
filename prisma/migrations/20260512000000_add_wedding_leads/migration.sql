-- CreateEnum
CREATE TYPE "WeddingLeadStatus" AS ENUM ('new', 'contacted', 'negotiating', 'confirmed', 'discarded');

-- CreateTable
CREATE TABLE "wedding_leads" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "phone" VARCHAR(30),
    "event_type" VARCHAR(100) NOT NULL,
    "event_date" DATE,
    "guest_count" INTEGER,
    "budget" VARCHAR(100),
    "message" TEXT,
    "status" "WeddingLeadStatus" NOT NULL DEFAULT 'new',
    "admin_notes" TEXT,
    "client_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wedding_leads_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "wedding_leads" ADD CONSTRAINT "wedding_leads_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
