ALTER TABLE share_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY sc_select ON share_codes
  FOR SELECT USING (true);

CREATE POLICY sc_own ON share_codes
  FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY sc_own ON share_codes
  FOR DELETE USING (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY sc_admin ON share_codes
  FOR ALL USING (current_setting('app.current_role', true) = 'admin');
