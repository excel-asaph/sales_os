-- AlterTable
ALTER TABLE "products" ADD COLUMN     "whatsapp_opening_text" TEXT;

-- CreateTable
CREATE TABLE "ad_products" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "ad_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ad_products_business_id_ad_id_key" ON "ad_products"("business_id", "ad_id");

-- AddForeignKey
ALTER TABLE "ad_products" ADD CONSTRAINT "ad_products_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_products" ADD CONSTRAINT "ad_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

