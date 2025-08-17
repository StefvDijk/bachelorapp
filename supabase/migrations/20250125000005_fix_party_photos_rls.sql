-- Fix RLS policies for party_photos table
-- This ensures that photo uploads work correctly

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on party_photos" ON public.party_photos;

-- Create a more permissive policy for party_photos
CREATE POLICY "party_photos_allow_all" 
ON public.party_photos 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Also create specific policies for different operations
CREATE POLICY "party_photos_select" 
ON public.party_photos 
FOR SELECT 
USING (true);

CREATE POLICY "party_photos_insert" 
ON public.party_photos 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "party_photos_update" 
ON public.party_photos 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

CREATE POLICY "party_photos_delete" 
ON public.party_photos 
FOR DELETE 
USING (true);

-- Ensure RLS is enabled
ALTER TABLE public.party_photos ENABLE ROW LEVEL SECURITY; 