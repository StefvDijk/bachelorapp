-- Create storage bucket for bingo photos
INSERT INTO storage.buckets (id, name, public) VALUES ('bingo-photos', 'bingo-photos', true);

-- Create policies for bingo photo uploads
CREATE POLICY "Anyone can view bingo photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'bingo-photos');

CREATE POLICY "Anyone can upload bingo photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'bingo-photos');

CREATE POLICY "Anyone can update bingo photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'bingo-photos');