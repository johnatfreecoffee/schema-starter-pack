-- Fix the handle_new_user function to use the new role_id structure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  customer_role_id uuid;
BEGIN
  -- Get the customer role ID
  SELECT id INTO customer_role_id
  FROM public.roles
  WHERE name = 'customer'
  LIMIT 1;

  -- Insert user role with role_id
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (NEW.id, customer_role_id);
  
  RETURN NEW;
END;
$function$;