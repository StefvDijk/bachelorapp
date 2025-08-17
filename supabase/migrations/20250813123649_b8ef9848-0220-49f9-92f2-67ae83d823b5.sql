-- Create points_history table for tracking all points transactions
CREATE TABLE public.points_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'spent')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;

-- Create policies for session-based access
CREATE POLICY "Users can view their own points history" 
ON public.points_history 
FOR SELECT 
USING (session_id = current_setting('app.current_session_id', true));

CREATE POLICY "Users can create their own points history" 
ON public.points_history 
FOR INSERT 
WITH CHECK (session_id = current_setting('app.current_session_id', true));

-- Create index for better performance
CREATE INDEX idx_points_history_session_created ON public.points_history(session_id, created_at DESC);