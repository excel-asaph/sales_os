-- AlterTable: default reflects the fixed 5-step follow-up sequence design
ALTER TABLE "business_config" ALTER COLUMN "max_followups" SET DEFAULT 5;

-- Existing rows were set from the old arbitrary default (3), not a real
-- business decision — bump them to the reasoned default too. Editable
-- immediately afterward via Settings.
UPDATE "business_config" SET "max_followups" = 5 WHERE "max_followups" = 3;
