-- Create a function to execute SQL (for one-time use)
CREATE OR REPLACE FUNCTION add_photo_url_to_treasure_hunt()
RETURNS void AS $$
BEGIN
  -- Add photo_url column to treasure_hunt table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'treasure_hunt' 
    AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE public.treasure_hunt ADD COLUMN photo_url TEXT;
    RAISE NOTICE 'Added photo_url column to treasure_hunt table';
  ELSE
    RAISE NOTICE 'photo_url column already exists in treasure_hunt table';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function
SELECT add_photo_url_to_treasure_hunt();

-- Clean up the function
DROP FUNCTION add_photo_url_to_treasure_hunt(); 