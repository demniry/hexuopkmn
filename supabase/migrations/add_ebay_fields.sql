-- Migration: Add eBay market price tracking fields to items table
-- Run this in your Supabase SQL Editor

-- Add eBay query field (the search terms used to find this item on eBay)
ALTER TABLE items ADD COLUMN IF NOT EXISTS ebay_query TEXT;

-- Add market price fields
ALTER TABLE items ADD COLUMN IF NOT EXISTS market_price DECIMAL(10,2);
ALTER TABLE items ADD COLUMN IF NOT EXISTS market_price_min DECIMAL(10,2);
ALTER TABLE items ADD COLUMN IF NOT EXISTS market_price_max DECIMAL(10,2);
ALTER TABLE items ADD COLUMN IF NOT EXISTS market_price_sales_count INTEGER;
ALTER TABLE items ADD COLUMN IF NOT EXISTS market_price_updated_at TIMESTAMPTZ;

-- Create index for faster queries on items with eBay queries
CREATE INDEX IF NOT EXISTS idx_items_ebay_query ON items(ebay_query) WHERE ebay_query IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN items.ebay_query IS 'eBay search query to find comparable sold listings';
COMMENT ON COLUMN items.market_price IS 'Median price from eBay sold listings';
COMMENT ON COLUMN items.market_price_min IS 'Minimum price from eBay sold listings';
COMMENT ON COLUMN items.market_price_max IS 'Maximum price from eBay sold listings';
COMMENT ON COLUMN items.market_price_sales_count IS 'Number of eBay sales used for price calculation';
COMMENT ON COLUMN items.market_price_updated_at IS 'Last time market price was updated';
