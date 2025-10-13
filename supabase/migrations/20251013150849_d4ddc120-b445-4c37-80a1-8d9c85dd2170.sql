-- Ensure 'customer' role exists
INSERT INTO public.roles (id, name, description, is_system_role, created_at, updated_at)
SELECT gen_random_uuid(), 'customer', 'Default customer role', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'customer');

-- Create triggers to run on new auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_profile();

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();