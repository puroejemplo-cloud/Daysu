-- CreateTable
CREATE TABLE "gallery_videos" (
    "id" SERIAL NOT NULL,
    "youtube_id" VARCHAR(20) NOT NULL,
    "title" VARCHAR(200),
    "event_type" VARCHAR(100),
    "package_asset_id" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gallery_videos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "gallery_videos" ADD CONSTRAINT "gallery_videos_package_asset_id_fkey" FOREIGN KEY ("package_asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
