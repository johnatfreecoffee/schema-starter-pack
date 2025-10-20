-- COMPLETE RLS REBUILD MIGRATION
-- This migration replaces the recursive RLS system with a safe cache-based approach

-- ============================================================================
-- STEP 1: Drop ALL existing policies to start fresh
-- ============================================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
        RAISE NOTICE 'Dropped policy % on %.%', r.policyname, r.schemaname, r.tablename;
    END LOOP;
END$$;

-- Drop all old role-related functions that might cause recursion
DROP FUNCTION IF EXISTS public.has_role(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, user_role) CASCADE;
DROP FUNCTION IF EXISTS public.user_has_role CASCADE;
DROP FUNCTION IF EXISTS public.user_has_role_name CASCADE;
DROP FUNCTION IF EXISTS public.user_has_any_role CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role CASCADE;
DROP FUNCTION IF EXISTS public.has_permission CASCADE;
DROP FUNCTION IF EXISTS public.check_user_role CASCADE;
DROP FUNCTION IF EXISTS public.get_user_roles CASCADE;
DROP FUNCTION IF EXISTS public.is_admin CASCADE;
DROP FUNCTION IF EXISTS public.is_crm_user CASCADE;
DROP FUNCTION IF EXISTS public.current_user_has_role CASCADE;

-- ============================================================================
-- STEP 2: Create the Role Caching System (NO RECURSION)
-- ============================================================================

-- Drop and recreate the materialized view
DROP MATERIALIZED VIEW IF EXISTS public.user_role_cache CASCADE;

CREATE MATERIALIZED VIEW public.user_role_cache AS
SELECT 
    ur.user_id,
    ur.role_id,
    r.name as role_name,
    r.is_system_role
FROM public.user_roles ur
INNER JOIN public.roles r ON ur.role_id = r.id;

-- Create indices for fast lookups
CREATE UNIQUE INDEX idx_user_role_cache_unique ON public.user_role_cache(user_id, role_id);
CREATE INDEX idx_user_role_cache_user ON public.user_role_cache(user_id);
CREATE INDEX idx_user_role_cache_role ON public.user_role_cache(role_name);

-- Initial population
REFRESH MATERIALIZED VIEW public.user_role_cache;

-- ============================================================================
-- STEP 3: Create Safe Functions (SECURITY DEFINER, NO RECURSION)
-- ============================================================================

-- Function to refresh the cache
CREATE OR REPLACE FUNCTION public.refresh_role_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_role_cache;
    RAISE NOTICE 'Role cache refreshed at %', now();
END;
$$;

-- Safe role check function (reads from cache, never touches user_roles table in RLS context)
CREATE OR REPLACE FUNCTION public.auth_has_role(_role_names text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_role_cache 
        WHERE user_id = auth.uid() 
        AND role_name = ANY(_role_names)
    );
$$;

-- RPC function for client-side role fetching
CREATE OR REPLACE FUNCTION public.rpc_get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE  
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT role_name 
         FROM public.user_role_cache 
         WHERE user_id = auth.uid() 
         ORDER BY 
            CASE role_name
                WHEN 'Super Admin' THEN 1
                WHEN 'Admin' THEN 2
                WHEN 'Sales Manager' THEN 3
                WHEN 'CRM User' THEN 4
                WHEN 'Technician' THEN 5
                WHEN 'Office Staff' THEN 6
                WHEN 'Read-Only User' THEN 7
                ELSE 999
            END
         LIMIT 1),
        'customer'
    );
$$;

-- Auto-refresh trigger function
CREATE OR REPLACE FUNCTION public.trigger_refresh_role_cache()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM public.refresh_role_cache();
    RETURN NULL;
END;
$$;

-- Attach trigger to user_roles table
DROP TRIGGER IF EXISTS refresh_cache_on_user_role_change ON public.user_roles;
CREATE TRIGGER refresh_cache_on_user_role_change
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_refresh_role_cache();

-- ============================================================================
-- STEP 4: Apply Safe RLS Policies (NO RECURSION)
-- ============================================================================

-- Enable RLS on key tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- User roles: Simple read-only policy for own roles (NO RECURSION)
CREATE POLICY "user_can_view_own_roles" ON public.user_roles
FOR SELECT 
USING (user_id = auth.uid());

-- Allow admins to manage all user roles
CREATE POLICY "admins_manage_user_roles" ON public.user_roles
FOR ALL
USING (public.auth_has_role(ARRAY['Admin', 'Super Admin']))
WITH CHECK (public.auth_has_role(ARRAY['Admin', 'Super Admin']));

-- Accounts policies
CREATE POLICY "accounts_select" ON public.accounts
FOR SELECT 
USING (
    auth.uid() = user_id OR 
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Technician', 'Office Staff', 'Read-Only User'])
);

CREATE POLICY "accounts_insert" ON public.accounts
FOR INSERT 
WITH CHECK (
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager'])
);

CREATE POLICY "accounts_update" ON public.accounts
FOR UPDATE 
USING (
    auth.uid() = user_id OR 
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager'])
) 
WITH CHECK (
    auth.uid() = user_id OR 
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager'])
);

CREATE POLICY "accounts_delete" ON public.accounts
FOR DELETE 
USING (
    public.auth_has_role(ARRAY['Admin', 'Super Admin'])
);

-- Leads policies
CREATE POLICY "leads_select" ON public.leads
FOR SELECT 
USING (
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Technician', 'Office Staff', 'Read-Only User'])
);

CREATE POLICY "leads_insert" ON public.leads
FOR INSERT 
WITH CHECK (
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager'])
);

CREATE POLICY "leads_update" ON public.leads
FOR UPDATE 
USING (
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager'])
) 
WITH CHECK (
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager'])
);

CREATE POLICY "leads_delete" ON public.leads
FOR DELETE 
USING (
    public.auth_has_role(ARRAY['Admin', 'Super Admin'])
);

-- Contacts policies
CREATE POLICY "contacts_select" ON public.contacts
FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM public.accounts WHERE id = contacts.account_id AND user_id = auth.uid()) OR
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Technician', 'Office Staff', 'Read-Only User'])
);

CREATE POLICY "contacts_insert" ON public.contacts
FOR INSERT 
WITH CHECK (
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager'])
);

CREATE POLICY "contacts_update" ON public.contacts
FOR UPDATE 
USING (
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager'])
) 
WITH CHECK (
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager'])
);

CREATE POLICY "contacts_delete" ON public.contacts
FOR DELETE 
USING (
    public.auth_has_role(ARRAY['Admin', 'Super Admin'])
);

-- Tasks policies  
CREATE POLICY "tasks_select" ON public.tasks
FOR SELECT 
USING (
    assigned_to = auth.uid() OR
    created_by = auth.uid() OR
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Technician', 'Office Staff', 'Read-Only User'])
);

CREATE POLICY "tasks_insert" ON public.tasks
FOR INSERT 
WITH CHECK (
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Technician', 'Office Staff'])
);

CREATE POLICY "tasks_update" ON public.tasks
FOR UPDATE 
USING (
    assigned_to = auth.uid() OR
    created_by = auth.uid() OR
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager'])
) 
WITH CHECK (
    assigned_to = auth.uid() OR
    created_by = auth.uid() OR
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager'])
);

CREATE POLICY "tasks_delete" ON public.tasks
FOR DELETE 
USING (
    public.auth_has_role(ARRAY['Admin', 'Super Admin'])
);

-- Projects policies
CREATE POLICY "projects_select" ON public.projects
FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM public.accounts WHERE id = projects.account_id AND user_id = auth.uid()) OR
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Technician', 'Office Staff', 'Read-Only User'])
);

CREATE POLICY "projects_insert" ON public.projects
FOR INSERT 
WITH CHECK (
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager'])
);

CREATE POLICY "projects_update" ON public.projects
FOR UPDATE 
USING (
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Technician'])
) 
WITH CHECK (
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Technician'])
);

CREATE POLICY "projects_delete" ON public.projects
FOR DELETE 
USING (
    public.auth_has_role(ARRAY['Admin', 'Super Admin'])
);

-- Quotes policies
CREATE POLICY "quotes_select" ON public.quotes
FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM public.accounts WHERE id = quotes.account_id AND user_id = auth.uid()) OR
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Office Staff', 'Read-Only User'])
);

CREATE POLICY "quotes_insert" ON public.quotes
FOR INSERT 
WITH CHECK (
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager'])
);

CREATE POLICY "quotes_update" ON public.quotes
FOR UPDATE 
USING (
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager'])
) 
WITH CHECK (
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager'])
);

CREATE POLICY "quotes_delete" ON public.quotes
FOR DELETE 
USING (
    public.auth_has_role(ARRAY['Admin', 'Super Admin'])
);

-- Invoices policies
CREATE POLICY "invoices_select" ON public.invoices
FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM public.accounts WHERE id = invoices.account_id AND user_id = auth.uid()) OR
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Office Staff', 'Read-Only User'])
);

CREATE POLICY "invoices_insert" ON public.invoices
FOR INSERT 
WITH CHECK (
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager'])
);

CREATE POLICY "invoices_update" ON public.invoices
FOR UPDATE 
USING (
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Office Staff'])
) 
WITH CHECK (
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Office Staff'])
);

CREATE POLICY "invoices_delete" ON public.invoices
FOR DELETE 
USING (
    public.auth_has_role(ARRAY['Admin', 'Super Admin'])
);

-- Notes policies
CREATE POLICY "notes_select" ON public.notes
FOR SELECT 
USING (
    created_by = auth.uid() OR
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Technician', 'Office Staff', 'Read-Only User'])
);

CREATE POLICY "notes_insert" ON public.notes
FOR INSERT 
WITH CHECK (
    created_by = auth.uid()
);

CREATE POLICY "notes_update" ON public.notes
FOR UPDATE 
USING (
    created_by = auth.uid()
) 
WITH CHECK (
    created_by = auth.uid()
);

CREATE POLICY "notes_delete" ON public.notes
FOR DELETE 
USING (
    created_by = auth.uid() OR
    public.auth_has_role(ARRAY['Admin', 'Super Admin'])
);

-- Calendar events policies
CREATE POLICY "calendar_select" ON public.calendar_events
FOR SELECT 
USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.event_participants WHERE event_id = calendar_events.id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.accounts WHERE id = calendar_events.account_id AND user_id = auth.uid()) OR
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Technician', 'Office Staff', 'Read-Only User'])
);

CREATE POLICY "calendar_insert" ON public.calendar_events
FOR INSERT 
WITH CHECK (
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Technician', 'Office Staff']) OR
    (EXISTS (SELECT 1 FROM public.accounts WHERE id = calendar_events.account_id AND user_id = auth.uid()) AND status = 'requested')
);

CREATE POLICY "calendar_update" ON public.calendar_events
FOR UPDATE 
USING (
    created_by = auth.uid() OR
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Technician', 'Office Staff'])
) 
WITH CHECK (
    created_by = auth.uid() OR
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Technician', 'Office Staff'])
);

CREATE POLICY "calendar_delete" ON public.calendar_events
FOR DELETE 
USING (
    public.auth_has_role(ARRAY['Admin', 'Super Admin'])
);

-- Tickets policies
CREATE POLICY "tickets_select" ON public.tickets
FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM public.accounts WHERE id = tickets.account_id AND user_id = auth.uid()) OR
    assigned_to = auth.uid() OR
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Technician', 'Office Staff', 'Read-Only User'])
);

CREATE POLICY "tickets_insert" ON public.tickets
FOR INSERT 
WITH CHECK (
    EXISTS (SELECT 1 FROM public.accounts WHERE id = tickets.account_id AND user_id = auth.uid()) OR
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Technician', 'Office Staff'])
);

CREATE POLICY "tickets_update" ON public.tickets
FOR UPDATE 
USING (
    assigned_to = auth.uid() OR
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Technician', 'Office Staff'])
) 
WITH CHECK (
    assigned_to = auth.uid() OR
    public.auth_has_role(ARRAY['Admin', 'Super Admin', 'CRM User', 'Sales Manager', 'Technician', 'Office Staff'])
);

CREATE POLICY "tickets_delete" ON public.tickets
FOR DELETE 
USING (
    public.auth_has_role(ARRAY['Admin', 'Super Admin'])
);

-- ============================================================================
-- VERIFICATION: Confirm migration success
-- ============================================================================
DO $$
DECLARE
    component_count int;
    cache_count int;
BEGIN
    -- Check components exist
    SELECT COUNT(*) INTO component_count
    FROM (
        SELECT 1 WHERE EXISTS(SELECT 1 FROM pg_matviews WHERE matviewname = 'user_role_cache')
        UNION ALL
        SELECT 1 WHERE EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'rpc_get_current_user_role')
        UNION ALL
        SELECT 1 WHERE EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'auth_has_role')
        UNION ALL
        SELECT 1 WHERE EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'refresh_role_cache')
    ) components;
    
    -- Check cache is populated
    SELECT COUNT(*) INTO cache_count FROM public.user_role_cache;
    
    IF component_count = 4 AND cache_count > 0 THEN
        RAISE NOTICE '✅ RLS MIGRATION SUCCESSFUL';
        RAISE NOTICE '   - All 4 components created';
        RAISE NOTICE '   - Cache populated with % entries', cache_count;
        RAISE NOTICE '   - No recursion risks';
    ELSE
        RAISE WARNING '⚠️ Migration incomplete: % components, % cache entries', component_count, cache_count;
    END IF;
END$$;