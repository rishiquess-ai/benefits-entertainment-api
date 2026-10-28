-- Run once on every real tenant database. POST /employee-details relies on
-- this index to stop two concurrent SSO logins creating the same user.
--
-- Check for existing duplicates first; the index cannot be created while any
-- remain:
--   SELECT unique_identifier_ref, COUNT(*) FROM "user"
--   GROUP BY unique_identifier_ref HAVING COUNT(*) > 1;
--
-- CONCURRENTLY avoids locking the live table, but cannot run inside a
-- transaction block. If it fails it leaves an INVALID index behind: drop it
-- and run this again.

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_user_unique_identifier_ref
  ON "user" (unique_identifier_ref);
