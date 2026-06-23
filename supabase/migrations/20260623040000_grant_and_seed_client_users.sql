-- The portal Settings view reads/writes the client_users table (profile name +
-- avatar). Without these grants it fails with 42501 permission denied, so the
-- profile picture never persists. Mirror the grants applied to other tables.
GRANT ALL ON public.client_users TO anon, authenticated;
GRANT ALL ON public.agency_users TO anon, authenticated;

-- Seed a default profile row for every client that doesn't already have one,
-- so the Settings page has an editable profile to save against (pre-auth demo).
INSERT INTO client_users (client_id, name, email, role)
SELECT
  c.id,
  COALESCE(c.contact_name, c.company_name || ' Admin'),
  COALESCE(c.contact_email, 'team+' || left(c.id::text, 8) || '@' || lower(regexp_replace(c.company_name, '[^a-zA-Z0-9]', '', 'g')) || '.com'),
  'admin'
FROM clients c
WHERE NOT EXISTS (
  SELECT 1 FROM client_users cu WHERE cu.client_id = c.id
);
