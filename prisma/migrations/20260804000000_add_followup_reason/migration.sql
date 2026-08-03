-- CreateEnum
CREATE TYPE "FollowupReason" AS ENUM ('GENERAL', 'AWAITING_PAYMENT_EVIDENCE');

-- AlterTable
ALTER TABLE "followups" ADD COLUMN "reason" "FollowupReason" NOT NULL DEFAULT 'GENERAL';
