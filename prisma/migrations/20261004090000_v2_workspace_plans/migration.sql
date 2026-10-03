-- CreateEnum
CREATE TYPE "WorkspacePlan" AS ENUM ('FREE', 'PAID');

-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "free_started_at" TIMESTAMP(3),
ADD COLUMN     "paid_until" TIMESTAMP(3),
ADD COLUMN     "plan" "WorkspacePlan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "suspended_at" TIMESTAMP(3),
ADD COLUMN     "suspended_reason" TEXT;


-- Every business from before plans existed (VitalFix) is paid with no end
-- date, so the AI keeps working exactly as before. Only businesses created
-- from now on start on the free plan.
UPDATE "businesses" SET "plan" = 'PAID';
