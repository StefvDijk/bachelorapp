-- Add points_balance column to sessions table
-- This tracks points spent in Simply Wild and Deal Maker's Shop
-- Separate from bingo task completion status

ALTER TABLE public.sessions 
ADD COLUMN points_balance INTEGER DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.sessions.points_balance IS 'Points spent in games/shop (negative value). Bingo tasks remain completed but points are deducted from balance.'; 