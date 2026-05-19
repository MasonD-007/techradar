-- Trigger to automatically sync role with is_admin
CREATE OR REPLACE FUNCTION set_admin_role()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_admin = true THEN
        NEW.role := 'admin';
    ELSIF NEW.is_admin = false THEN
        NEW.role := 'user';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_role_from_is_admin
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_admin_role();