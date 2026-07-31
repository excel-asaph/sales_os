-- CreateEnum
CREATE TYPE "ConversationStage" AS ENUM ('NEW_LEAD', 'GREETING_SENT', 'INTRODUCTION_COMPLETED', 'INTEREST_CONFIRMED', 'PRODUCT_SELECTED', 'WAITING_FOR_DECISION', 'WAITING_FOR_PAYMENT', 'RECEIPT_RECEIVED', 'PAYMENT_VERIFIED', 'PRODUCT_DELIVERED', 'SALE_COMPLETED', 'FOLLOWUP_DAY_1', 'FOLLOWUP_DAY_3', 'FOLLOWUP_DAY_7', 'LOST_LEAD', 'HUMAN_REVIEW_REQUIRED', 'HUMAN_ASSIGNED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "MessageSender" AS ENUM ('CUSTOMER', 'AI', 'HUMAN');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'DOCUMENT', 'VOICE');

-- CreateEnum
CREATE TYPE "FactKind" AS ENUM ('INTENT', 'GOAL', 'OBJECTION', 'ENTITY', 'TASK');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'VERIFIED', 'ESCALATED', 'REJECTED');

-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "whatsapp_phone_number_id" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_config" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "deliver_before_payment" BOOLEAN NOT NULL DEFAULT false,
    "max_followups" INTEGER NOT NULL DEFAULT 3,
    "escalation_confidence_threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "business_hours" JSONB,
    "greeting_template" TEXT,

    CONSTRAINT "business_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_accounts" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "payment_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "file_url" TEXT,
    "format" TEXT,
    "category" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "name" TEXT,
    "preferred_language" TEXT,
    "country" TEXT,
    "timezone" TEXT,
    "returning_customer" BOOLEAN NOT NULL DEFAULT false,
    "lifetime_purchases" INTEGER NOT NULL DEFAULT 0,
    "customer_since" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tags" JSONB,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "current_stage" "ConversationStage" NOT NULL DEFAULT 'NEW_LEAD',
    "current_objective" TEXT,
    "confidence" DOUBLE PRECISION,
    "assigned_human_id" TEXT,
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "sender" "MessageSender" NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "content" TEXT,
    "media_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_facts" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "kind" "FactKind" NOT NULL,
    "payload" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_facts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "payment_account_id" TEXT,
    "expected_amount" DECIMAL(65,30) NOT NULL,
    "receipt_image_url" TEXT,
    "extracted_amount" DECIMAL(65,30),
    "extracted_bank" TEXT,
    "verification_confidence" DOUBLE PRECISION,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followups" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "followups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "human_agents" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "human_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_config_business_id_key" ON "business_config"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_business_id_phone_number_key" ON "customers"("business_id", "phone_number");

-- AddForeignKey
ALTER TABLE "business_config" ADD CONSTRAINT "business_config_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_accounts" ADD CONSTRAINT "payment_accounts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_assigned_human_id_fkey" FOREIGN KEY ("assigned_human_id") REFERENCES "human_agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_facts" ADD CONSTRAINT "conversation_facts_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_account_id_fkey" FOREIGN KEY ("payment_account_id") REFERENCES "payment_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followups" ADD CONSTRAINT "followups_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "human_agents" ADD CONSTRAINT "human_agents_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
