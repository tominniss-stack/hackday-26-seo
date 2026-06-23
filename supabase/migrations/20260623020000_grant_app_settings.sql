-- Grant permissions on the app_settings table to the anon and authenticated
-- roles. Without this, the admin settings page fails with:
--   42501: permission denied for table app_settings
-- This mirrors the grants applied to the other public tables.
GRANT ALL ON public.app_settings TO anon, authenticated;
