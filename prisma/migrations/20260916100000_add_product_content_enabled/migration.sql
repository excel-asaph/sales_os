-- Settings toggle for answering from the product's own text. Defaults to true
-- so a business that has already loaded its text sees no behaviour change.
ALTER TABLE "business_config"
  ADD COLUMN "product_content_enabled" BOOLEAN NOT NULL DEFAULT true;
