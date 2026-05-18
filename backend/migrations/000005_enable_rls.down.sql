-- Drop RLS policies
DROP POLICY IF EXISTS users_signup ON users;
DROP POLICY IF EXISTS users_own ON users;
DROP POLICY IF EXISTS users_admin ON users;
DROP POLICY IF EXISTS ut_own ON user_technologies;
DROP POLICY IF EXISTS ut_admin ON user_technologies;
DROP POLICY IF EXISTS blips_read ON blips;
DROP POLICY IF EXISTS blips_admin ON blips;
DROP POLICY IF EXISTS technology_read ON technology;
DROP POLICY IF EXISTS technology_admin ON technology;

-- Disable Row Level Security
ALTER TABLE IF EXISTS technology DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blips DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_technologies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;