-- Drop the existing treasure_hunt table and recreate it with photo_url column
DROP TABLE IF EXISTS public.treasure_hunt CASCADE;

-- Create new treasure_hunt table with photo_url column
CREATE TABLE public.treasure_hunt (
  id SERIAL PRIMARY KEY,
  location_name TEXT NOT NULL,
  found BOOLEAN DEFAULT FALSE,
  found_at TIMESTAMP WITH TIME ZONE,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Re-enable Row Level Security
ALTER TABLE public.treasure_hunt ENABLE ROW LEVEL SECURITY;

-- Re-create policies
CREATE POLICY "Allow all operations on treasure_hunt" 
ON public.treasure_hunt 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Insert the default treasure hunt locations
INSERT INTO public.treasure_hunt (id, location_name, found, found_at) VALUES
(1, '🏈 Locatie 1: Voetbal Quiz - Osnabrück, Duitsland', false, null),
(2, '🍺 Locatie 2: Bar Quiz - Osnabrück, Duitsland', false, null),
(3, '🍺 Locatie 3: Bier Quiz - Osnabrück, Duitsland', false, null); 