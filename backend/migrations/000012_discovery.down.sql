DROP TABLE IF EXISTS template_technologies;
DROP TABLE IF EXISTS templates;
DROP INDEX IF EXISTS idx_share_codes_listed;
ALTER TABLE share_codes DROP CONSTRAINT IF EXISTS share_codes_listed_requires_public;
ALTER TABLE share_codes DROP COLUMN IF EXISTS listed;
