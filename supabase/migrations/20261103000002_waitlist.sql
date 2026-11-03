-- Create waitlist table for landing page
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anonymous or authenticated insertion
CREATE POLICY "Anyone can join waitlist" ON public.waitlist
    FOR INSERT WITH CHECK (true);

-- Only service role can read waitlist emails
CREATE POLICY "Only admin can view waitlist" ON public.waitlist
    FOR SELECT USING (auth.role() = 'service_role');
