DROP POLICY IF EXISTS sc_select ON share_codes;
DROP POLICY IF EXISTS sc_own ON share_codes;
DROP POLICY IF EXISTS sc_admin ON share_codes;

ALTER TABLE share_codes DISABLE ROW LEVEL SECURITY;
