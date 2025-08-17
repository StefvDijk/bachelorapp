-- Fix security issue: Implement proper session isolation for game tables
-- Currently all game tables allow public read access, exposing session data to all players

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all operations on bingo_tasks" ON public.bingo_tasks;
DROP POLICY IF EXISTS "Allow all operations on challenges" ON public.challenges;  
DROP POLICY IF EXISTS "Allow all operations on treasure_hunt" ON public.treasure_hunt;
DROP POLICY IF EXISTS "Allow all operations on live_challenges" ON public.live_challenges;

-- Create secure policies for bingo_tasks table
CREATE POLICY "Users can only access their own bingo tasks" 
ON public.bingo_tasks 
FOR SELECT 
USING (
  session_id = current_setting('app.current_session_id', true)
);

CREATE POLICY "Users can only update their own bingo tasks"
ON public.bingo_tasks 
FOR UPDATE 
USING (
  session_id = current_setting('app.current_session_id', true)
);

CREATE POLICY "Users can insert bingo tasks for their session"
ON public.bingo_tasks 
FOR INSERT 
WITH CHECK (
  session_id = current_setting('app.current_session_id', true)
);

CREATE POLICY "Restrict bingo task deletion"
ON public.bingo_tasks 
FOR DELETE 
USING (
  current_setting('app.allow_admin_operations', true) = 'true'
);

-- Create secure policies for challenges table
CREATE POLICY "Users can only access their own challenges" 
ON public.challenges 
FOR SELECT 
USING (
  session_id = current_setting('app.current_session_id', true)
);

CREATE POLICY "Users can only update their own challenges"
ON public.challenges 
FOR UPDATE 
USING (
  session_id = current_setting('app.current_session_id', true)
);

CREATE POLICY "Users can insert challenges for their session"
ON public.challenges 
FOR INSERT 
WITH CHECK (
  session_id = current_setting('app.current_session_id', true)
);

CREATE POLICY "Restrict challenge deletion"
ON public.challenges 
FOR DELETE 
USING (
  current_setting('app.allow_admin_operations', true) = 'true'
);

-- Create secure policies for treasure_hunt table
CREATE POLICY "Users can only access their own treasure hunts" 
ON public.treasure_hunt 
FOR SELECT 
USING (
  session_id = current_setting('app.current_session_id', true)
);

CREATE POLICY "Users can only update their own treasure hunts"
ON public.treasure_hunt 
FOR UPDATE 
USING (
  session_id = current_setting('app.current_session_id', true)
);

CREATE POLICY "Users can insert treasure hunts for their session"
ON public.treasure_hunt 
FOR INSERT 
WITH CHECK (
  session_id = current_setting('app.current_session_id', true)
);

CREATE POLICY "Restrict treasure hunt deletion"
ON public.treasure_hunt 
FOR DELETE 
USING (
  current_setting('app.allow_admin_operations', true) = 'true'
);

-- Create secure policies for live_challenges table
CREATE POLICY "Users can only access their own live challenges" 
ON public.live_challenges 
FOR SELECT 
USING (
  session_id = current_setting('app.current_session_id', true)
);

CREATE POLICY "Users can only update their own live challenges"
ON public.live_challenges 
FOR UPDATE 
USING (
  session_id = current_setting('app.current_session_id', true)
);

CREATE POLICY "Users can insert live challenges for their session"
ON public.live_challenges 
FOR INSERT 
WITH CHECK (
  session_id = current_setting('app.current_session_id', true)
);

CREATE POLICY "Restrict live challenge deletion"
ON public.live_challenges 
FOR DELETE 
USING (
  current_setting('app.allow_admin_operations', true) = 'true'
);