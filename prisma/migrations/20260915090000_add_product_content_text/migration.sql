-- Product text extracted from its file, for answering content questions
-- without a retrieval layer. Nullable: every existing row keeps working.
ALTER TABLE "products" ADD COLUMN "content_text" TEXT;
