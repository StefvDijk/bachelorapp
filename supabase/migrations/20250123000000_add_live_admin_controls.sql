-- Create table for live admin messages to players
CREATE TABLE public.live_messages (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'urgent', 'celebration'
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN DEFAULT FALSE
);

-- Create table for live admin challenges/tasks
CREATE TABLE public.live_challenges (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL DEFAULT 'instant', -- 'instant', 'timed', 'emergency'
  time_limit INTEGER, -- in seconds
  points_reward INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  photo_url TEXT,
  is_completed BOOLEAN DEFAULT FALSE
);

-- Enable RLS on new tables
ALTER TABLE public.live_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_challenges ENABLE ROW LEVEL SECURITY;

-- Create policies for live_messages
CREATE POLICY "Allow all operations on live_messages" ON public.live_messages FOR ALL USING (true) WITH CHECK (true);

-- Create policies for live_challenges  
CREATE POLICY "Allow all operations on live_challenges" ON public.live_challenges FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_live_messages_session_id ON public.live_messages(session_id);
CREATE INDEX idx_live_messages_read ON public.live_messages(is_read);
CREATE INDEX idx_live_challenges_session_id ON public.live_challenges(session_id);
CREATE INDEX idx_live_challenges_completed ON public.live_challenges(is_completed); 