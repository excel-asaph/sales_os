-- CreateIndex
CREATE INDEX "conversation_facts_conversation_id_idx" ON "conversation_facts"("conversation_id");

-- CreateIndex
CREATE INDEX "conversations_customer_id_idx" ON "conversations"("customer_id");

-- CreateIndex
CREATE INDEX "conversations_channel_id_idx" ON "conversations"("channel_id");

-- CreateIndex
CREATE INDEX "conversations_product_id_idx" ON "conversations"("product_id");

-- CreateIndex
CREATE INDEX "conversations_assigned_human_id_idx" ON "conversations"("assigned_human_id");

-- CreateIndex
CREATE INDEX "events_conversation_id_created_at_idx" ON "events"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "followups_conversation_id_idx" ON "followups"("conversation_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_conversation_id_idx" ON "orders"("conversation_id");

-- CreateIndex
CREATE INDEX "orders_product_id_idx" ON "orders"("product_id");

