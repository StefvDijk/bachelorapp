-- Fix missing points_balance column in sessions table
-- This column is essential for the centralized points system

DO $$ 
BEGIN
  -- Check if column already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' 
    AND column_name = 'points_balance'
  ) THEN
    -- Add the column if it doesn't exist
    ALTER TABLE public.sessions 
    ADD COLUMN points_balance INTEGER DEFAULT 0;
    
    -- Add comment for clarity
    COMMENT ON COLUMN public.sessions.points_balance IS 'Current points balance for the session. Updated when earning/spending points.';
  END IF;
END $$; 