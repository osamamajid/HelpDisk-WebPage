# Backend init script run after DB starts.
# Creates the schema extensions and seeds default categories/brands/OS/tags.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Default categories are seeded by the backend on first run,
-- so the DB layer here only ensures extensions exist.
