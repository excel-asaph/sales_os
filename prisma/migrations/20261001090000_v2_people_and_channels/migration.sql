-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'AGENT');

-- CreateEnum
CREATE TYPE "ChannelStatus" AS ENUM ('ACTIVE', 'DISCONNECTED');

-- AlterTable
ALTER TABLE "business_meta_connections" ADD COLUMN     "encrypted_app_secret" TEXT,
ADD COLUMN     "encrypted_webhook_verify_token" TEXT,
ADD COLUMN     "meta_app_id" TEXT,
ADD COLUMN     "webhook_key" TEXT;

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "channel_id" TEXT,
ADD COLUMN     "product_id" TEXT;

-- AlterTable
ALTER TABLE "human_agents" ADD COLUMN     "role" "MemberRole",
ADD COLUMN     "user_id" TEXT;

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT,
    "google_id" TEXT,
    "email_verified_at" TIMESTAMP(3),
    "is_platform_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channels" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "phone_number_id" TEXT NOT NULL,
    "display_number" TEXT,
    "label" TEXT,
    "status" "ChannelStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_products" (
    "channel_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,

    CONSTRAINT "channel_products_pkey" PRIMARY KEY ("channel_id","product_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "channels_phone_number_id_key" ON "channels"("phone_number_id");

-- CreateIndex
CREATE INDEX "channels_business_id_idx" ON "channels"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_meta_connections_webhook_key_key" ON "business_meta_connections"("webhook_key");

-- CreateIndex
CREATE UNIQUE INDEX "human_agents_business_id_user_id_key" ON "human_agents"("business_id", "user_id");

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_products" ADD CONSTRAINT "channel_products_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_products" ADD CONSTRAINT "channel_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "human_agents" ADD CONSTRAINT "human_agents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

