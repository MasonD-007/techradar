DROP INDEX IF EXISTS idx_user_technologies_ring_id;
DROP INDEX IF EXISTS idx_user_technologies_technology_id;
DROP INDEX IF EXISTS idx_user_technologies_user_id;
DROP INDEX IF EXISTS idx_quadrants_name;
DROP INDEX IF EXISTS idx_rings_name;
DROP INDEX IF EXISTS idx_technology_quadrant_id;
DROP INDEX IF EXISTS idx_technology_blip_id;
DROP INDEX IF EXISTS idx_technology_name;

DROP TABLE IF EXISTS user_technologies;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS technology;
DROP TABLE IF EXISTS blips;
DROP TABLE IF EXISTS quadrants;
DROP TABLE IF EXISTS rings;
