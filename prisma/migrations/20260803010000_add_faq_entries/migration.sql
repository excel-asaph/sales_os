-- CreateTable
CREATE TABLE "faq_entries" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faq_entries_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "faq_entries" ADD CONSTRAINT "faq_entries_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
