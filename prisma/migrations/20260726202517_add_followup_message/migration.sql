/*
  Warnings:

  - Added the required column `message` to the `followups` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "followups" ADD COLUMN     "message" TEXT NOT NULL;
