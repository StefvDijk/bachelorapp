-- Implement proper session isolation for security
-- The previous approach still allowed access to all sessions
-- We need policies that actually restrict based on the session being queried

-- Drop existing policies
DROP POLICY IF EXISTS "Limit session data exposure" ON public.sessions;
DROP POLICY IF EXISTS "Users can only update their own session data" ON public.sessions; 
DROP POLICY IF EXISTS "Users can insert new sessions" ON public.sessions;
DROP POLICY IF EXISTS "Only admin can delete sessions" ON public.sessions;

-- Create a custom context for session access
-- This will be set by the application before making queries
CREATE OR REPLACE FUNCTION public.set_session_context(session_id TEXT)
RETURNS VOID AS $$
BEGIN
  -- Store the session ID in a custom setting for this transaction
  PERFORM set_config('app.current_session_id', session_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Function to get the current session context
CREATE OR REPLACE FUNCTION public.get_session_context()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_session_id', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Now create policies that actually enforce session isolation

-- Policy for SELECT: Only allow reading the session that was set in context
CREATE POLICY "Users can only read sessions in their context" 
ON public.sessions 
FOR SELECT 
USING (
  id = current_setting('app.current_session_id', true)
);

-- Policy for UPDATE: Only allow updating the session that was set in context  
CREATE POLICY "Users can only update sessions in their context"
ON public.sessions 
FOR UPDATE 
USING (
  id = current_setting('app.current_session_id', true)
);

-- Policy for INSERT: Allow inserting new sessions with any ID
CREATE POLICY "Allow inserting new sessions"
ON public.sessions 
FOR INSERT 
WITH CHECK (true);

-- Policy for DELETE: Very restrictive - only allow if explicitly enabled
CREATE POLICY "Restrict session deletion"
ON public.sessions 
FOR DELETE 
USING (
  -- Only allow deletion if admin flag is set
  current_setting('app.allow_admin_operations', true) = 'true'
);

-- Fix the search path for the existing function
DROP FUNCTION IF EXISTS public.verify_session_access(TEXT);
CREATE OR REPLACE FUNCTION public.verify_session_access(session_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN session_id = current_setting('app.current_session_id', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';