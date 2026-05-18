-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE blips ENABLE ROW LEVEL SECURITY;
ALTER TABLE technology ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS users_signup ON users;
DROP POLICY IF EXISTS users_own ON users;
DROP POLICY IF EXISTS users_admin ON users;
DROP POLICY IF EXISTS ut_own ON user_technologies;
DROP POLICY IF EXISTS ut_admin ON user_technologies;
DROP POLICY IF EXISTS blips_read ON blips;
DROP POLICY IF EXISTS blips_admin ON blips;
DROP POLICY IF EXISTS technology_read ON technology;
DROP POLICY IF EXISTS technology_admin ON technology;

-- Users policies
CREATE POLICY users_signup ON users
  FOR INSERT WITH CHECK (
    current_setting('app.current_user_id', true) IS NULL
    OR current_setting('app.current_user_id', true) = ''
  );

CREATE POLICY users_own ON users
  FOR ALL USING (id = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK (id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY users_admin ON users
  FOR ALL USING (current_setting('app.current_role', true) = 'admin');

-- User technologies policies
CREATE POLICY ut_own ON user_technologies
  FOR ALL USING (user_id = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY ut_admin ON user_technologies
  FOR ALL USING (current_setting('app.current_role', true) = 'admin');

-- Blips policies (admin only for write operations)
CREATE POLICY blips_read ON blips FOR SELECT USING (true);

CREATE POLICY blips_admin ON blips
  FOR ALL USING (current_setting('app.current_role', true) = 'admin');

-- Technology policies (admin only for write operations)
CREATE POLICY technology_read ON technology FOR SELECT USING (true);

CREATE POLICY technology_admin ON technology
  FOR ALL USING (current_setting('app.current_role', true) = 'admin');