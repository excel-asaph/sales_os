-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "additional_whatsapp_phone_number_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "whatsapp_phone_number_id" TEXT;
