-- Grant permissions to anon and authenticated roles for all tables
-- This is required for RLS policies to work properly

-- Grant permissions on clients table
GRANT ALL ON public.clients TO anon, authenticated;

-- Grant permissions on reports table
GRANT ALL ON public.reports TO anon, authenticated;

-- Grant permissions on metrics_snapshots table
GRANT ALL ON public.metrics_snapshots TO anon, authenticated;

-- Grant permissions on narratives table
GRANT ALL ON public.narratives TO anon, authenticated;
