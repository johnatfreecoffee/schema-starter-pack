-- Update has_role to use roles table via role_id and keep old enum signature
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT CASE
    WHEN _role = 'admin'::user_role THEN EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = _user_id AND r.name IN ('Admin','Super Admin')
    )
    WHEN _role = 'crm_user'::user_role THEN EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = _user_id AND r.name IN ('CRM User','Sales Manager','Technician','Office Staff','Read-Only User')
    )
    WHEN _role = 'customer'::user_role THEN EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = _user_id AND r.name = 'customer'
    )
    ELSE false
  END;
$function$;

-- Update get_user_role to derive legacy enum from new roles
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = _user_id AND r.name IN ('Admin','Super Admin')
    ) THEN 'admin'::user_role
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = _user_id AND r.name IN ('CRM User','Sales Manager','Technician','Office Staff','Read-Only User')
    ) THEN 'crm_user'::user_role
    ELSE 'customer'::user_role
  END;
$function$;

-- Update update_ticket_last_message to use roles table instead of user_roles.role
CREATE OR REPLACE FUNCTION public.update_ticket_last_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE tickets
  SET 
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at,
    unread_by_customer = CASE 
      WHEN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = NEW.sender_id
          AND r.name IN ('Admin','Super Admin','CRM User','Sales Manager','Technician','Office Staff')
      ) THEN true
      ELSE unread_by_customer
    END,
    unread_by_agent = CASE 
      WHEN NOT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = NEW.sender_id
          AND r.name IN ('Admin','Super Admin','CRM User','Sales Manager','Technician','Office Staff')
      ) THEN true
      ELSE unread_by_agent
    END
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$function$;