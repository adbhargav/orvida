-- ORVIDA incremental schema
-- Safe to run repeatedly: every statement is guarded.

-- 1. Gifting concierge enquiries submitted from the storefront form.
CREATE TABLE IF NOT EXISTS enquiries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  occasion VARCHAR(120),
  quantity VARCHAR(120),
  budget_per_hamper VARCHAR(120),
  notes TEXT,
  status VARCHAR(30) DEFAULT 'New',           -- New, Contacted, Quoted, Won, Closed
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Newsletter signups from the footer.
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  source VARCHAR(60) DEFAULT 'footer',
  is_active BOOLEAN DEFAULT TRUE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Saved delivery addresses, previously held only in localStorage.
CREATE TABLE IF NOT EXISTS addresses (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(60),
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(120) NOT NULL,
  state VARCHAR(120) NOT NULL,
  pincode VARCHAR(12) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);

-- 4. Refund ledger. One order may be refunded more than once.
CREATE TABLE IF NOT EXISTS refunds (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  razorpay_refund_id VARCHAR(100) UNIQUE,
  razorpay_payment_id VARCHAR(100),
  amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(30) DEFAULT 'pending',       -- pending, processed, failed
  speed VARCHAR(20) DEFAULT 'normal',
  reason TEXT,
  initiated_by INT REFERENCES users(id) ON DELETE SET NULL,
  notes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_refunds_order ON refunds(order_id);

-- 5. Webhook receipts. The unique event id makes delivery idempotent, so a
--    replayed Razorpay event cannot double-apply.
CREATE TABLE IF NOT EXISTS webhook_events (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(40) DEFAULT 'razorpay',
  event_id VARCHAR(160) UNIQUE NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(30) DEFAULT 'received',      -- received, processed, ignored, failed
  error TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_webhook_type ON webhook_events(event_type);

-- 6. Order columns for refunds and payment failure detail.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_failed_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- 7. Product SKU on order lines so an invoice can reproduce what was sold
--    even after the catalogue changes.
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS sku VARCHAR(100);

-- 8. Reviews gain a moderation flag so the storefront only shows approved copy.
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS order_id INT REFERENCES orders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

-- 9. Delhivery shipping integration.
--    Products carry the FINAL PACKED PARCEL figures (not raw plant size);
--    orders carry the shipment created for them. Everything is nullable so
--    existing rows keep working untouched.
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_weight_kg NUMERIC(7, 3);
ALTER TABLE products ADD COLUMN IF NOT EXISTS package_length_cm NUMERIC(6, 1);
ALTER TABLE products ADD COLUMN IF NOT EXISTS package_width_cm NUMERIC(6, 1);
ALTER TABLE products ADD COLUMN IF NOT EXISTS package_height_cm NUMERIC(6, 1);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_provider VARCHAR(40);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delhivery_awb VARCHAR(60);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delhivery_shipment_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(60);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_status VARCHAR(60);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipment_created_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipment_error TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_awb ON orders(delhivery_awb);

-- 10. Editable site content. One row per content block (homepage brand story,
--     Our Story page, …), the whole block stored as JSON. The storefront
--     falls back to its built-in copy when a key is absent.
CREATE TABLE IF NOT EXISTS site_content (
  key VARCHAR(80) PRIMARY KEY,
  content JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Optional portrait/square banner artwork for phones. Without it the
--     storefront letterboxes the wide image instead of cropping it.
ALTER TABLE banners ADD COLUMN IF NOT EXISTS mobile_image TEXT;

-- 12. Admin uploads live in the database, not on disk: Render's filesystem
--     is wiped on every deploy, which kept breaking uploaded imagery.
CREATE TABLE IF NOT EXISTS uploads (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) UNIQUE NOT NULL,
  mime_type VARCHAR(80) NOT NULL,
  data BYTEA NOT NULL,
  size_bytes INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. SEO. Per-entity overrides live on the entities themselves (a separate
--     SEO table would mean a join on every catalogue read); global settings
--     stay in site_content under the 'seo_settings' key. Everything is
--     nullable: empty means "fall back at render time", so an admin can
--     always take over a value later without a migration.
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_keywords TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_robots VARCHAR(40);
ALTER TABLE products ADD COLUMN IF NOT EXISTS og_title VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS og_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS og_image TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS twitter_title VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS twitter_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS twitter_image TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_alt_text VARCHAR(255);

ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_keywords TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS meta_robots VARCHAR(40);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS og_title VARCHAR(255);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS og_description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS og_image TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_alt_text VARCHAR(255);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS meta_robots VARCHAR(40);
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS og_image TEXT;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS image_alt_text VARCHAR(255);

-- Slug changes must not break inbound links or lose accumulated ranking.
CREATE TABLE IF NOT EXISTS redirects (
  id SERIAL PRIMARY KEY,
  source TEXT UNIQUE NOT NULL,             -- path only, e.g. /product/old-slug
  destination TEXT NOT NULL,
  status_code SMALLINT DEFAULT 301,
  entity_type VARCHAR(30),                 -- product, category, subcategory, manual
  entity_id INT,
  hits INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_redirects_source ON redirects(source);
