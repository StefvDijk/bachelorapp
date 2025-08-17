
-- Add session_id column to bingo_tasks table
ALTER TABLE public.bingo_tasks ADD COLUMN session_id TEXT;

-- Add session_id column to treasure_hunt table  
ALTER TABLE public.treasure_hunt ADD COLUMN session_id TEXT;

-- Add session_id column to challenges table
ALTER TABLE public.challenges ADD COLUMN session_id TEXT;

-- Create index for better performance on session queries
CREATE INDEX idx_bingo_tasks_session_id ON public.bingo_tasks(session_id);
CREATE INDEX idx_treasure_hunt_session_id ON public.treasure_hunt(session_id);
CREATE INDEX idx_challenges_session_id ON public.challenges(session_id);

-- Create a sessions table to track active sessions
CREATE TABLE public.sessions (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_name TEXT
);

-- Enable RLS on sessions table
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on sessions" ON public.sessions FOR ALL USING (true) WITH CHECK (true);
