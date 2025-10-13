-- Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

-- Update user_roles table to reference roles table
-- First, drop the existing user_roles table if it exists
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Recreate user_roles with reference to roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role_id)
);

-- Enable RLS on all tables
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for permissions (admins can manage)
CREATE POLICY "Admins can view permissions" ON public.permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'Super Admin'
    )
  );

CREATE POLICY "Admins can manage permissions" ON public.permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'Super Admin'
    )
  );

-- RLS Policies for roles
CREATE POLICY "Authenticated users can view roles" ON public.roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage roles" ON public.roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('Super Admin', 'Admin')
    )
  );

-- RLS Policies for role_permissions
CREATE POLICY "Authenticated users can view role permissions" ON public.role_permissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage role permissions" ON public.role_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('Super Admin', 'Admin')
    )
  );

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all user roles" ON public.user_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('Super Admin', 'Admin')
    )
  );

CREATE POLICY "Admins can manage user roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('Super Admin', 'Admin')
    )
  );

-- Trigger for updated_at on roles
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert all permissions
INSERT INTO public.permissions (name, description, module, action) VALUES
  -- Company Settings
  ('company.view', 'View company settings', 'company', 'view'),
  ('company.edit', 'Edit company settings', 'company', 'edit'),
  
  -- Services
  ('services.view', 'View services', 'services', 'view'),
  ('services.create', 'Create services', 'services', 'create'),
  ('services.edit', 'Edit services', 'services', 'edit'),
  ('services.delete', 'Delete services', 'services', 'delete'),
  
  -- Service Areas
  ('areas.view', 'View service areas', 'areas', 'view'),
  ('areas.create', 'Create service areas', 'areas', 'create'),
  ('areas.edit', 'Edit service areas', 'areas', 'edit'),
  ('areas.delete', 'Delete service areas', 'areas', 'delete'),
  
  -- Templates
  ('templates.view', 'View templates', 'templates', 'view'),
  ('templates.create', 'Create templates', 'templates', 'create'),
  ('templates.edit', 'Edit templates', 'templates', 'edit'),
  ('templates.delete', 'Delete templates', 'templates', 'delete'),
  
  -- Static Pages
  ('pages.view', 'View static pages', 'pages', 'view'),
  ('pages.create', 'Create static pages', 'pages', 'create'),
  ('pages.edit', 'Edit static pages', 'pages', 'edit'),
  ('pages.delete', 'Delete static pages', 'pages', 'delete'),
  
  -- Leads
  ('leads.view', 'View leads', 'leads', 'view'),
  ('leads.create', 'Create leads', 'leads', 'create'),
  ('leads.edit', 'Edit leads', 'leads', 'edit'),
  ('leads.delete', 'Delete leads', 'leads', 'delete'),
  ('leads.convert', 'Convert leads', 'leads', 'convert'),
  ('leads.export', 'Export leads', 'leads', 'export'),
  ('leads.import', 'Import leads', 'leads', 'import'),
  
  -- Accounts
  ('accounts.view', 'View accounts', 'accounts', 'view'),
  ('accounts.create', 'Create accounts', 'accounts', 'create'),
  ('accounts.edit', 'Edit accounts', 'accounts', 'edit'),
  ('accounts.delete', 'Delete accounts', 'accounts', 'delete'),
  ('accounts.export', 'Export accounts', 'accounts', 'export'),
  
  -- Contacts
  ('contacts.view', 'View contacts', 'contacts', 'view'),
  ('contacts.create', 'Create contacts', 'contacts', 'create'),
  ('contacts.edit', 'Edit contacts', 'contacts', 'edit'),
  ('contacts.delete', 'Delete contacts', 'contacts', 'delete'),
  
  -- Projects
  ('projects.view', 'View projects', 'projects', 'view'),
  ('projects.create', 'Create projects', 'projects', 'create'),
  ('projects.edit', 'Edit projects', 'projects', 'edit'),
  ('projects.delete', 'Delete projects', 'projects', 'delete'),
  ('projects.assign', 'Assign projects', 'projects', 'assign'),
  
  -- Tasks
  ('tasks.view', 'View tasks', 'tasks', 'view'),
  ('tasks.create', 'Create tasks', 'tasks', 'create'),
  ('tasks.edit', 'Edit tasks', 'tasks', 'edit'),
  ('tasks.delete', 'Delete tasks', 'tasks', 'delete'),
  ('tasks.assign', 'Assign tasks', 'tasks', 'assign'),
  
  -- Calendar
  ('calendar.view', 'View calendar', 'calendar', 'view'),
  ('calendar.create', 'Create events', 'calendar', 'create'),
  ('calendar.edit', 'Edit events', 'calendar', 'edit'),
  ('calendar.delete', 'Delete events', 'calendar', 'delete'),
  
  -- Money
  ('quotes.view', 'View quotes', 'quotes', 'view'),
  ('quotes.create', 'Create quotes', 'quotes', 'create'),
  ('quotes.edit', 'Edit quotes', 'quotes', 'edit'),
  ('quotes.delete', 'Delete quotes', 'quotes', 'delete'),
  ('quotes.approve', 'Approve quotes', 'quotes', 'approve'),
  ('invoices.view', 'View invoices', 'invoices', 'view'),
  ('invoices.create', 'Create invoices', 'invoices', 'create'),
  ('invoices.edit', 'Edit invoices', 'invoices', 'edit'),
  ('invoices.delete', 'Delete invoices', 'invoices', 'delete'),
  ('invoices.send', 'Send invoices', 'invoices', 'send'),
  ('payments.view', 'View payments', 'payments', 'view'),
  ('payments.record', 'Record payments', 'payments', 'record'),
  
  -- Notes
  ('notes.view', 'View notes', 'notes', 'view'),
  ('notes.create', 'Create notes', 'notes', 'create'),
  ('notes.edit', 'Edit notes', 'notes', 'edit'),
  ('notes.delete', 'Delete notes', 'notes', 'delete'),
  
  -- Documents
  ('documents.view', 'View documents', 'documents', 'view'),
  ('documents.upload', 'Upload documents', 'documents', 'upload'),
  ('documents.delete', 'Delete documents', 'documents', 'delete'),
  
  -- Users
  ('users.view', 'View users', 'users', 'view'),
  ('users.create', 'Create users', 'users', 'create'),
  ('users.edit', 'Edit users', 'users', 'edit'),
  ('users.delete', 'Delete users', 'users', 'delete'),
  ('users.manage_roles', 'Manage user roles', 'users', 'manage_roles'),
  
  -- Roles
  ('roles.view', 'View roles', 'roles', 'view'),
  ('roles.create', 'Create roles', 'roles', 'create'),
  ('roles.edit', 'Edit roles', 'roles', 'edit'),
  ('roles.delete', 'Delete roles', 'roles', 'delete'),
  
  -- Analytics
  ('analytics.view', 'View analytics', 'analytics', 'view'),
  ('analytics.export', 'Export analytics', 'analytics', 'export'),
  
  -- Settings
  ('settings.view', 'View settings', 'settings', 'view'),
  ('settings.edit', 'Edit settings', 'settings', 'edit')
ON CONFLICT (name) DO NOTHING;

-- Insert default roles
INSERT INTO public.roles (name, description, is_system_role) VALUES
  ('Super Admin', 'Full access to all features and settings', true),
  ('Admin', 'Administrative access to most features', true),
  ('Sales Manager', 'Manage leads, accounts, quotes, and sales operations', true),
  ('Technician', 'Access to assigned projects and tasks', true),
  ('Office Staff', 'Basic access to view and create records', true),
  ('Read-Only User', 'View-only access to most modules', true)
ON CONFLICT DO NOTHING;

-- Assign permissions to Super Admin (all permissions)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Super Admin'
ON CONFLICT DO NOTHING;

-- Assign permissions to Admin (all except users.delete and roles.delete)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Admin' 
  AND p.name NOT IN ('users.delete', 'roles.delete')
ON CONFLICT DO NOTHING;

-- Assign permissions to Sales Manager
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Sales Manager' 
  AND (
    p.module IN ('leads', 'accounts', 'contacts', 'quotes', 'tasks', 'calendar', 'notes')
    OR p.name IN ('invoices.view', 'projects.view', 'analytics.view')
  )
ON CONFLICT DO NOTHING;

-- Assign permissions to Technician
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Technician' 
  AND p.name IN (
    'projects.view', 'projects.edit',
    'tasks.view', 'tasks.edit',
    'calendar.view',
    'notes.view', 'notes.create',
    'contacts.view',
    'accounts.view'
  )
ON CONFLICT DO NOTHING;

-- Assign permissions to Office Staff
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Office Staff' 
  AND p.name IN (
    'leads.view', 'leads.create', 'leads.edit',
    'accounts.view',
    'contacts.view', 'contacts.create',
    'quotes.view',
    'invoices.view',
    'calendar.view',
    'tasks.view',
    'notes.view'
  )
ON CONFLICT DO NOTHING;

-- Assign permissions to Read-Only User (all view permissions)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Read-Only User' 
  AND p.action = 'view'
ON CONFLICT DO NOTHING;