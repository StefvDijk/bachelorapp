-- Create storage buckets for Supabase Pro
-- This migration creates the necessary storage buckets and policies

-- Create bingo-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'bingo-photos', 
  'bingo-photos', 
  true, 
  52428800, -- 50MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
);

-- Create party-photos bucket (alternative name used in some parts)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'party-photos', 
  'party-photos', 
  true, 
  52428800, -- 50MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
);

-- Create storage policies for bingo-photos
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'bingo-photos');

CREATE POLICY "Public Upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'bingo-photos' AND (storage.foldername(name))[1] = 'public');

CREATE POLICY "Public Update" ON storage.objects
FOR UPDATE USING (bucket_id = 'bingo-photos');

CREATE POLICY "Public Delete" ON storage.objects
FOR DELETE USING (bucket_id = 'bingo-photos');

-- Create storage policies for party-photos
CREATE POLICY "Public Access Party" ON storage.objects
FOR SELECT USING (bucket_id = 'party-photos');

CREATE POLICY "Public Upload Party" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'party-photos' AND (storage.foldername(name))[1] = 'public');

CREATE POLICY "Public Update Party" ON storage.objects
FOR UPDATE USING (bucket_id = 'party-photos');

CREATE POLICY "Public Delete Party" ON storage.objects
FOR DELETE USING (bucket_id = 'party-photos');

-- Create a function to setup storage if not exists
CREATE OR REPLACE FUNCTION setup_storage_buckets()
RETURNS void AS $$
BEGIN
  -- Check if bingo-photos bucket exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'bingo-photos') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
    VALUES (
      'bingo-photos', 
      'bingo-photos', 
      true, 
      52428800,
      ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    );
  END IF;
  
  -- Check if party-photos bucket exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'party-photos') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
    VALUES (
      'party-photos', 
      'party-photos', 
      true, 
      52428800,
      ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the setup function
SELECT setup_storage_buckets(); 