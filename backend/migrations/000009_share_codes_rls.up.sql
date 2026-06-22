ALTER TABLE share_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sc_select ON share_codes;
DROP POLICY IF EXISTS sc_own ON share_codes;
DROP POLICY IF EXISTS sc_admin ON share_codes;

CREATE POLICY sc_select ON share_codes
  FOR SELECT USING (true);

CREATE POLICY sc_own ON share_codes
  FOR ALL
  USING (user_id = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY sc_admin ON share_codes
  FOR ALL USING (current_setting('app.current_role', true) = 'admin');
