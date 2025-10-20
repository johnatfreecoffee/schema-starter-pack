// Permission system constants and utilities

export interface Permission {
  id: string;
  name: string;
  module: string;
  action: string;
  description: string;
  category: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

// Permission categories and their permissions
export const PERMISSION_CATEGORIES = {
  COMPANY: {
    name: 'Company Settings',
    description: 'Manage company information and business details',
    permissions: [
      { module: 'company', action: 'view', description: 'View company settings' },
      { module: 'company', action: 'edit', description: 'Edit company settings' },
    ],
  },
  SERVICES: {
    name: 'Services Management',
    description: 'Manage services and service areas',
    permissions: [
      { module: 'services', action: 'view', description: 'View services' },
      { module: 'services', action: 'create', description: 'Create new services' },
      { module: 'services', action: 'edit', description: 'Edit services' },
      { module: 'services', action: 'delete', description: 'Delete services' },
      { module: 'service_areas', action: 'view', description: 'View service areas' },
      { module: 'service_areas', action: 'create', description: 'Create service areas' },
      { module: 'service_areas', action: 'edit', description: 'Edit service areas' },
      { module: 'service_areas', action: 'delete', description: 'Delete service areas' },
    ],
  },
  CRM: {
    name: 'CRM Access',
    description: 'Access to customer relationship management features',
    permissions: [
      { module: 'leads', action: 'view', description: 'View leads' },
      { module: 'leads', action: 'create', description: 'Create new leads' },
      { module: 'leads', action: 'edit', description: 'Edit leads' },
      { module: 'leads', action: 'delete', description: 'Delete leads' },
      { module: 'accounts', action: 'view', description: 'View accounts' },
      { module: 'accounts', action: 'create', description: 'Create accounts' },
      { module: 'accounts', action: 'edit', description: 'Edit accounts' },
      { module: 'accounts', action: 'delete', description: 'Delete accounts' },
      { module: 'contacts', action: 'view', description: 'View contacts' },
      { module: 'contacts', action: 'create', description: 'Create contacts' },
      { module: 'contacts', action: 'edit', description: 'Edit contacts' },
      { module: 'contacts', action: 'delete', description: 'Delete contacts' },
      { module: 'tasks', action: 'view', description: 'View tasks' },
      { module: 'tasks', action: 'create', description: 'Create tasks' },
      { module: 'tasks', action: 'edit', description: 'Edit tasks' },
      { module: 'tasks', action: 'delete', description: 'Delete tasks' },
      { module: 'projects', action: 'view', description: 'View projects' },
      { module: 'projects', action: 'create', description: 'Create projects' },
      { module: 'projects', action: 'edit', description: 'Edit projects' },
      { module: 'projects', action: 'delete', description: 'Delete projects' },
      { module: 'calendar', action: 'view', description: 'View calendar' },
      { module: 'calendar', action: 'create', description: 'Create events' },
      { module: 'calendar', action: 'edit', description: 'Edit events' },
      { module: 'calendar', action: 'delete', description: 'Delete events' },
    ],
  },
  FINANCIAL: {
    name: 'Financial',
    description: 'Manage quotes, invoices, and payments',
    permissions: [
      { module: 'quotes', action: 'view', description: 'View quotes' },
      { module: 'quotes', action: 'create', description: 'Create quotes' },
      { module: 'quotes', action: 'edit', description: 'Edit quotes' },
      { module: 'quotes', action: 'delete', description: 'Delete quotes' },
      { module: 'invoices', action: 'view', description: 'View invoices' },
      { module: 'invoices', action: 'create', description: 'Create invoices' },
      { module: 'invoices', action: 'edit', description: 'Edit invoices' },
      { module: 'invoices', action: 'delete', description: 'Delete invoices' },
      { module: 'payments', action: 'view', description: 'View payments' },
      { module: 'payments', action: 'create', description: 'Record payments' },
    ],
  },
  CUSTOMER_PORTAL: {
    name: 'Customer Portal',
    description: 'Manage customer portal features',
    permissions: [
      { module: 'customers', action: 'view', description: 'View customer data' },
      { module: 'customers', action: 'manage', description: 'Manage customers' },
    ],
  },
  SUPPORT: {
    name: 'Support',
    description: 'Manage tickets and customer support',
    permissions: [
      { module: 'tickets', action: 'view', description: 'View tickets' },
      { module: 'tickets', action: 'create', description: 'Create tickets' },
      { module: 'tickets', action: 'edit', description: 'Edit tickets' },
      { module: 'tickets', action: 'delete', description: 'Delete tickets' },
      { module: 'tickets', action: 'respond', description: 'Respond to tickets' },
    ],
  },
  SYSTEM: {
    name: 'System Administration',
    description: 'Manage users, backups, and system settings',
    permissions: [
      { module: 'users', action: 'view', description: 'View users' },
      { module: 'users', action: 'create', description: 'Create users' },
      { module: 'users', action: 'edit', description: 'Edit users' },
      { module: 'users', action: 'delete', description: 'Delete users' },
      { module: 'roles', action: 'view', description: 'View roles' },
      { module: 'roles', action: 'create', description: 'Create roles' },
      { module: 'roles', action: 'edit', description: 'Edit roles' },
      { module: 'roles', action: 'delete', description: 'Delete roles' },
      { module: 'permissions', action: 'manage', description: 'Manage permissions' },
      { module: 'backups', action: 'view', description: 'View backups' },
      { module: 'backups', action: 'create', description: 'Create backups' },
      { module: 'backups', action: 'restore', description: 'Restore backups' },
      { module: 'backups', action: 'delete', description: 'Delete backups' },
      { module: 'settings', action: 'view', description: 'View system settings' },
      { module: 'settings', action: 'edit', description: 'Edit system settings' },
    ],
  },
  REPORTS: {
    name: 'Reports & Analytics',
    description: 'Access analytics and generate reports',
    permissions: [
      { module: 'reports', action: 'view', description: 'View reports' },
      { module: 'reports', action: 'create', description: 'Create custom reports' },
      { module: 'analytics', action: 'view', description: 'View analytics dashboard' },
    ],
  },
};

// Utility to check if a permission matches
export function hasPermission(
  userPermissions: Array<{ module: string; action: string }>,
  module: string,
  action: string
): boolean {
  return userPermissions.some(
    (p) => p.module === module && p.action === action
  );
}

// Utility to check if user has any permission in a module
export function hasModuleAccess(
  userPermissions: Array<{ module: string; action: string }>,
  module: string
): boolean {
  return userPermissions.some((p) => p.module === module);
}

// Get all permissions as a flat array
export function getAllPermissions(): Array<{
  module: string;
  action: string;
  description: string;
  category: string;
}> {
  const permissions: Array<{
    module: string;
    action: string;
    description: string;
    category: string;
  }> = [];

  Object.entries(PERMISSION_CATEGORIES).forEach(([key, category]) => {
    category.permissions.forEach((perm) => {
      permissions.push({
        ...perm,
        category: category.name,
      });
    });
  });

  return permissions;
}
