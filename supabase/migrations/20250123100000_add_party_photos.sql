-- Create table for party photos wall
CREATE TABLE public.party_photos (
  id SERIAL PRIMARY KEY,
  uploader_name TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  votes INTEGER DEFAULT 0,
  is_photo_of_night BOOLEAN DEFAULT FALSE
);

-- Enable RLS on party_photos table
ALTER TABLE public.party_photos ENABLE ROW LEVEL SECURITY;

-- Create policy for party_photos - allow all operations for everyone
CREATE POLICY "Allow all operations on party_photos" 
ON public.party_photos 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_party_photos_uploaded_at ON public.party_photos(uploaded_at DESC);
CREATE INDEX idx_party_photos_votes ON public.party_photos(votes DESC);

-- Create function to increment photo votes
CREATE OR REPLACE FUNCTION increment_photo_votes(photo_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.party_photos 
  SET votes = votes + 1 
  WHERE id = photo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 