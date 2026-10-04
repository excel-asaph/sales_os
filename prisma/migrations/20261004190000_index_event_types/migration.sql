-- CreateIndex
CREATE INDEX "events_type_conversation_id_created_at_idx" ON "events"("type", "conversation_id", "created_at" DESC);

