-- Patch: make new-user role assignment idempotent to prevent duplicate key errors
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  customer_role_id uuid;
BEGIN
  -- Ensure we have the 'customer' role id
  SELECT id INTO customer_role_id
  FROM public.roles
  WHERE name = 'customer'
  LIMIT 1;

  IF customer_role_id IS NULL THEN
    -- Create 'customer' role if missing (idempotent)
    INSERT INTO public.roles (id, name, description, is_system_role, created_at, updated_at)
    VALUES (gen_random_uuid(), 'customer', 'Default customer role', true, now(), now())
    ON CONFLICT (name) DO NOTHING;

    SELECT id INTO customer_role_id FROM public.roles WHERE name = 'customer' LIMIT 1;
  END IF;

  -- Assign default role on user creation; ignore if already exists to avoid 23505
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (NEW.id, customer_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;