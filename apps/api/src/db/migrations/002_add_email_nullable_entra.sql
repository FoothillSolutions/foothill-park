-- Allow entra_id to be NULL so BambooHR-synced employees can exist before SSO login.
-- Add email for linking BambooHR rows to SSO sign-ins.

ALTER TABLE employees ALTER COLUMN entra_id DROP NOT NULL;

ALTER TABLE employees ADD COLUMN IF NOT EXISTS email VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_email
  ON employees(email) WHERE email IS NOT NULL;
