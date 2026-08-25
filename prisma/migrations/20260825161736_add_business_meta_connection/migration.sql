-- CreateTable
CREATE TABLE "business_meta_connections" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "waba_id" TEXT NOT NULL,
    "encrypted_access_token" TEXT NOT NULL,
    "conversions_dataset_id" TEXT,
    "followup_template_name" TEXT,
    "followup_template_lang" TEXT,
    "business_verification_status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_verified_at" TIMESTAMP(3),

    CONSTRAINT "business_meta_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_meta_connections_business_id_key" ON "business_meta_connections"("business_id");

-- AddForeignKey
ALTER TABLE "business_meta_connections" ADD CONSTRAINT "business_meta_connections_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
