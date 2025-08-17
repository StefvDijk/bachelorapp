-- Create missing tables for AdminDashboard and PhotoWall functionality

-- Create live_messages table for admin live messaging
CREATE TABLE public.live_messages (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create live_challenges table for admin live challenges
CREATE TABLE public.live_challenges (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  time_limit INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create party_photos table for photo wall functionality
CREATE TABLE public.party_photos (
  id SERIAL PRIMARY KEY,
  uploader_name TEXT NOT NULL DEFAULT 'Feestganger',
  photo_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  votes INTEGER NOT NULL DEFAULT 0,
  is_photo_of_night BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all new tables
ALTER TABLE public.live_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_photos ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for all operations (matching existing pattern)
CREATE POLICY "Allow all operations on live_messages" 
ON public.live_messages 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on live_challenges" 
ON public.live_challenges 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on party_photos" 
ON public.party_photos 
FOR ALL 
USING (true) 
WITH CHECK (true);