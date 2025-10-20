-- Fix Security Function search_path Issues

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix generate_ticket_number function  
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  year TEXT := EXTRACT(YEAR FROM NOW())::TEXT;
  count INTEGER;
  ticket_num TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO count
  FROM tickets
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  
  ticket_num := 'TICKET-' || year || '-' || LPAD(count::TEXT, 4, '0');
  RETURN ticket_num;
END;
$$;

-- Fix update_ticket_last_message function
CREATE OR REPLACE FUNCTION public.update_ticket_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;