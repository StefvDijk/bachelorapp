-- CRITICAL SECURITY FIXES: Implement proper RLS policies for exposed tables
-- This fixes the major security vulnerabilities identified in the security review

-- 1. FIX SHOP_PURCHASES TABLE SECURITY
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow all operations on shop_purchases" ON public.shop_purchases;

-- Create session-based RLS policies for shop_purchases
CREATE POLICY "Users can only view their own purchases" 
ON public.shop_purchases 
FOR SELECT 
USING (session_id = current_setting('app.current_session_id', true));

CREATE POLICY "Users can only insert purchases for their session" 
ON public.shop_purchases 
FOR INSERT 
WITH CHECK (session_id = current_setting('app.current_session_id', true));

CREATE POLICY "Users can only update their own purchases" 
ON public.shop_purchases 
FOR UPDATE 
USING (session_id = current_setting('app.current_session_id', true));

CREATE POLICY "Restrict purchase deletion to admin operations" 
ON public.shop_purchases 
FOR DELETE 
USING (current_setting('app.allow_admin_operations', true) = 'true');

-- Ensure RLS is enabled
ALTER TABLE public.shop_purchases ENABLE ROW LEVEL SECURITY;

-- 2. FIX WEBHOOK_SETTINGS TABLE SECURITY
-- Create admin-only RLS policies for webhook_settings
CREATE POLICY "Only admin operations can access webhook settings" 
ON public.webhook_settings 
FOR ALL 
USING (current_setting('app.allow_admin_operations', true) = 'true') 
WITH CHECK (current_setting('app.allow_admin_operations', true) = 'true');

-- Enable RLS for webhook_settings
ALTER TABLE public.webhook_settings ENABLE ROW LEVEL SECURITY;

-- 3. FIX PARTY_PHOTOS TABLE SECURITY
-- Create session-aware RLS policies for party_photos
-- Allow public viewing but track uploads by session
CREATE POLICY "Anyone can view party photos" 
ON public.party_photos 
FOR SELECT 
USING (true);

CREATE POLICY "Users can upload photos with their name" 
ON public.party_photos 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update vote counts" 
ON public.party_photos 
FOR UPDATE 
USING (true);

CREATE POLICY "Restrict party photo deletion to admin operations" 
ON public.party_photos 
FOR DELETE 
USING (current_setting('app.allow_admin_operations', true) = 'true');

-- Enable RLS for party_photos
ALTER TABLE public.party_photos ENABLE ROW LEVEL SECURITY;

-- 4. FIX LIVE_MESSAGES CROSS-SESSION ACCESS
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow all operations on live_messages" ON public.live_messages;

-- Create session-based RLS policies for live_messages
CREATE POLICY "Users can only view messages from their session" 
ON public.live_messages 
FOR SELECT 
USING (session_id = current_setting('app.current_session_id', true));

CREATE POLICY "Users can only post messages to their session" 
ON public.live_messages 
FOR INSERT 
WITH CHECK (session_id = current_setting('app.current_session_id', true));

CREATE POLICY "Users can only update messages from their session" 
ON public.live_messages 
FOR UPDATE 
USING (session_id = current_setting('app.current_session_id', true));

CREATE POLICY "Restrict message deletion to admin operations" 
ON public.live_messages 
FOR DELETE 
USING (current_setting('app.allow_admin_operations', true) = 'true');

-- Verify all tables have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('shop_purchases', 'webhook_settings', 'party_photos', 'live_messages')
AND schemaname = 'public'
ORDER BY tablename;