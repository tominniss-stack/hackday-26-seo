-- Add secure_access_token to clients table for portal access control
-- This UUID token must be provided as ?key= parameter to view client reports

ALTER TABLE clients
ADD COLUMN secure_access_token UUID DEFAULT gen_random_uuid() NOT NULL;

-- Create unique index for fast lookups
CREATE UNIQUE INDEX idx_clients_secure_access_token ON clients (secure_access_token);
