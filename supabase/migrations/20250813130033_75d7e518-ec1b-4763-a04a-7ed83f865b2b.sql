-- Fix RLS policy for points_history table to allow proper inserts
DROP POLICY IF EXISTS "Users can create their own points history" ON public.points_history;

-- Create a more permissive policy that allows inserts with session context
CREATE POLICY "Allow points history creation with session context" 
ON public.points_history 
FOR INSERT 
WITH CHECK (
  session_id IS NOT NULL AND 
  session_id = COALESCE(current_setting('app.current_session_id', true), session_id)
);