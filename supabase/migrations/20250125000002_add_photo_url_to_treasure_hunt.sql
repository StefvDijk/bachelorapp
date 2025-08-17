-- Add photo_url column to treasure_hunt table
ALTER TABLE public.treasure_hunt 
ADD COLUMN photo_url TEXT;

-- Update the TypeScript types to include photo_url
-- This will be reflected in the generated types.ts file 