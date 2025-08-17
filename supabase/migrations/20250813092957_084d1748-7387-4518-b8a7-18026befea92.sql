-- Create shop_purchases table for tracking user purchases
CREATE TABLE public.shop_purchases (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_purchases ENABLE ROW LEVEL SECURITY;

-- Create policies for shop purchases
CREATE POLICY "Allow all operations on shop_purchases" 
ON public.shop_purchases 
FOR ALL 
USING (true);

-- Create unique constraint to prevent duplicate purchases per session
ALTER TABLE public.shop_purchases 
ADD CONSTRAINT shop_purchases_unique_per_session 
UNIQUE (session_id, item_id);

-- Create index for better performance
CREATE INDEX idx_shop_purchases_session_id ON public.shop_purchases(session_id);