-- Create table for shop purchases
CREATE TABLE public.shop_purchases (
  id SERIAL PRIMARY KEY,
  session_id TEXT,
  item_id TEXT NOT NULL,
  bundle_id TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: Foreign key constraint will be added in a later migration
-- after the sessions table is created

-- Enable Row Level Security
ALTER TABLE public.shop_purchases ENABLE ROW LEVEL SECURITY;

-- Create policies (public access since no authentication)
CREATE POLICY "Allow all operations on shop_purchases" ON public.shop_purchases FOR ALL USING (true) WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_shop_purchases_session_id ON public.shop_purchases(session_id);
CREATE INDEX idx_shop_purchases_item_id ON public.shop_purchases(item_id); 

-- Prevent double purchases per session
ALTER TABLE public.shop_purchases
  ADD CONSTRAINT shop_purchases_unique_per_session UNIQUE (session_id, item_id);