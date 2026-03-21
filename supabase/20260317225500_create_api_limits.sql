-- Create api_limits table to track API usage and quota
CREATE TABLE IF NOT EXISTS public.api_limits (
    service TEXT PRIMARY KEY,
    requests_limit INTEGER,
    requests_remaining INTEGER,
    reset_at TIMESTAMPTZ,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.api_limits ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for the status dashboard/endpoint)
CREATE POLICY "Allow public read access" 
ON public.api_limits 
FOR SELECT 
USING (true);

-- Allow service_role to manage limits
CREATE POLICY "Allow service_role full access" 
ON public.api_limits 
FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

-- Grant select to all
GRANT SELECT ON public.api_limits TO anon, authenticated, service_role;
