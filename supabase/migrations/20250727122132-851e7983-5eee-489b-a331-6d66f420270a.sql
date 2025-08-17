-- Add pending_task column to sessions table
ALTER TABLE public.sessions 
ADD COLUMN pending_task INTEGER;