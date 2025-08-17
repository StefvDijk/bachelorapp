-- Add foreign key constraint for shop_purchases table
-- This migration runs after the sessions table is created

ALTER TABLE public.shop_purchases 
ADD CONSTRAINT fk_shop_purchases_session_id 
FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE; 