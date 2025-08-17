-- Lock down public access to webhook_settings and keep Edge Function working via service role
ALTER TABLE public.webhook_settings ENABLE ROW LEVEL SECURITY;

-- Drop overly permissive policy
DROP POLICY IF EXISTS "Allow all operations on webhook_settings" ON public.webhook_settings;

-- Intentionally do not create a public SELECT policy.
-- Edge Functions should read this table using the service role key which bypasses RLS.
-- If an admin UI is needed later, add a specific authenticated policy with proper checks.
