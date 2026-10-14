ALTER TABLE share_codes
    ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('public', 'private'));

CREATE TABLE share_code_viewers (
    share_code_id TEXT NOT NULL REFERENCES share_codes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (share_code_id, user_id)
);

CREATE INDEX idx_share_code_viewers_user_id ON share_code_viewers(user_id);

ALTER TABLE share_code_viewers ENABLE ROW LEVEL SECURITY;

CREATE POLICY scv_own ON share_code_viewers
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM share_codes sc
    WHERE sc.id = share_code_viewers.share_code_id
      AND sc.user_id = current_setting('app.current_user_id', true)::uuid
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM share_codes sc
    WHERE sc.id = share_code_viewers.share_code_id
      AND sc.user_id = current_setting('app.current_user_id', true)::uuid
  ));

CREATE POLICY scv_admin ON share_code_viewers
  FOR ALL USING (current_setting('app.current_role', true) = 'admin');
