-- AlterTable
ALTER TABLE "faq_entries" ADD COLUMN     "product_id" TEXT;

-- CreateTable
CREATE TABLE "product_settings" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "playbook" JSONB,
    "deliver_before_payment" BOOLEAN,
    "followups_enabled" BOOLEAN,
    "max_followups" INTEGER,
    "ai_handles_receipt_issues" BOOLEAN,
    "product_content_enabled" BOOLEAN,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_settings_product_id_key" ON "product_settings"("product_id");

-- AddForeignKey
ALTER TABLE "faq_entries" ADD CONSTRAINT "faq_entries_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_settings" ADD CONSTRAINT "product_settings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

