-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "setup_checklist_hidden_at" TIMESTAMP(3),
ADD COLUMN     "test_chat_used_at" TIMESTAMP(3);


-- A business that already has real customers is past setup (VitalFix):
-- it never sees the new-business checklist.
UPDATE "businesses" b SET "setup_checklist_hidden_at" = NOW()
WHERE EXISTS (SELECT 1 FROM "customers" c WHERE c."business_id" = b."id" AND NOT c."is_test");
