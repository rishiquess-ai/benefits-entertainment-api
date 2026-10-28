-- MOCK schema and data for local development (see docker-compose.yml).
-- Table and column names mirror the placeholders in
-- src/tenancy/tenant-config.repository.ts and
-- src/employee-details/employee.mapping.ts; update all three together.

-- Least-privilege accounts, as the real ones should be.
CREATE ROLE mock_master_user LOGIN PASSWORD 'mock_master_password';
CREATE ROLE mock_tenant_user LOGIN PASSWORD 'mock_tenant_password';

CREATE DATABASE mock_master;
CREATE DATABASE mock_tenant_benefits_entertainment;

-- Master database: one row per tenant with its database connection details.
\connect mock_master

CREATE TABLE tenant_configs (
  id SERIAL PRIMARY KEY,
  subdomain VARCHAR(63) NOT NULL UNIQUE,
  db_host VARCHAR(255) NOT NULL,
  db_port INTEGER NOT NULL,
  db_name VARCHAR(63) NOT NULL,
  db_username VARCHAR(63) NOT NULL,
  db_password VARCHAR(255) NOT NULL
);

-- The API runs on the host, so the tenant DB is reached via the mapped port.
INSERT INTO tenant_configs
  (subdomain, db_host, db_port, db_name, db_username, db_password)
VALUES
  ('benefits-entertainment', '127.0.0.1', 5434,
   'mock_tenant_benefits_entertainment', 'mock_tenant_user', 'mock_tenant_password');

GRANT SELECT ON tenant_configs TO mock_master_user;

-- Tenant database.
\connect mock_tenant_benefits_entertainment

CREATE TABLE "user" (
  id SERIAL PRIMARY KEY,
  unique_identifier_ref VARCHAR(100) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  email VARCHAR(255) NOT NULL,
  mobile VARCHAR(20),
  -- Internal columns that must never be filled from the token or returned.
  password VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'employee',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stops concurrent SSO logins from creating duplicate users.
CREATE UNIQUE INDEX uq_user_unique_identifier_ref ON "user" (unique_identifier_ref);

INSERT INTO "user"
  (unique_identifier_ref, first_name, last_name, email, mobile, password, role)
VALUES
  ('EMP000001', 'Existing', 'Employee', 'existing.employee@example.com',
   '9000000001', 'not-a-real-hash', 'employee');

GRANT SELECT, INSERT ON "user" TO mock_tenant_user;
GRANT USAGE ON SEQUENCE user_id_seq TO mock_tenant_user;
