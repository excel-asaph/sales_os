/*
  Warnings:

  - Added the required column `password_hash` to the `human_agents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "human_agents" ADD COLUMN     "is_admin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password_hash" TEXT NOT NULL;
