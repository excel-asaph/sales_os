-- AlterTable
ALTER TABLE "business_meta_connections" ADD COLUMN     "last_webhook_at" TIMESTAMP(3),
ADD COLUMN     "webhook_verified_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "meta_connection_drafts" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "encrypted_access_token" TEXT,
    "meta_app_id" TEXT,
    "encrypted_app_secret" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meta_connection_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "meta_connection_drafts_business_id_key" ON "meta_connection_drafts"("business_id");

-- AddForeignKey
ALTER TABLE "meta_connection_drafts" ADD CONSTRAINT "meta_connection_drafts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

