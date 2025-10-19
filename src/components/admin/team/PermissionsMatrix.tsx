import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { CRUDLogger } from '@/lib/crudLogger';

interface PermissionsMatrixProps {
  userId: string;
  userRole: string;
}

interface Permission {
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

const MODULES = [
  { id: 'leads', label: 'Leads' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'projects', label: 'Projects' },
  { id: 'money', label: 'Money' },
  { id: 'services', label: 'Services' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings', label: 'Settings' },
];

export function PermissionsMatrix({ userId, userRole }: PermissionsMatrixProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, Permission>>({});

  useEffect(() => {
    loadPermissions();
  }, [userId]);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      // Get the user's role ID
      const { data: userRoleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) throw roleError;

      const permissionsMap: Record<string, Permission> = {};
      
      // Initialize all modules with no permissions
      MODULES.forEach(module => {
        permissionsMap[module.id] = {
          module: module.id,
          can_view: false,
          can_create: false,
          can_edit: false,
          can_delete: false,
        };
      });

      if (userRoleData?.role_id) {
        // Load permissions from role_permissions table
        const { data: rolePerms, error: permsError } = await supabase
          .from('role_permissions')
          .select('permissions(name, action, module)')
          .eq('role_id', userRoleData.role_id);

        if (permsError) throw permsError;

        // Map role permissions to modules
        rolePerms?.forEach((item: any) => {
          const perm = item.permissions;
          if (perm && perm.module) {
            const module = perm.module;
            if (permissionsMap[module]) {
              if (perm.action === 'view') permissionsMap[module].can_view = true;
              if (perm.action === 'create') permissionsMap[module].can_create = true;
              if (perm.action === 'edit') permissionsMap[module].can_edit = true;
              if (perm.action === 'delete') permissionsMap[module].can_delete = true;
            }
          }
        });
      }

      // Admins get all permissions by default
      if (userRole === 'Super Admin' || userRole === 'Admin') {
        MODULES.forEach(module => {
          permissionsMap[module.id] = {
            module: module.id,
            can_view: true,
            can_create: true,
            can_edit: true,
            can_delete: true,
          };
        });
      }

      setPermissions(permissionsMap);
    } catch (error: any) {
      console.error('Error loading permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load permissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (module: string, action: keyof Omit<Permission, 'module'>, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: checked,
      },
    }));
  };

  // Permissions are inherited from role - this is view-only
  // No save function needed as permissions come from role_permissions table

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const isAdmin = userRole === 'Super Admin' || userRole === 'Admin';

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm">
        <p className="font-medium text-blue-900 mb-1">Role-Based Permissions</p>
        <p className="text-blue-700">
          These permissions are inherited from the user's role and cannot be modified at the user level. 
          To change permissions, modify the role's permissions or assign the user to a different role.
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-4 font-medium">Module</th>
              <th className="text-center p-4 font-medium">View</th>
              <th className="text-center p-4 font-medium">Create</th>
              <th className="text-center p-4 font-medium">Edit</th>
              <th className="text-center p-4 font-medium">Delete</th>
            </tr>
          </thead>
          <tbody>
            {MODULES.map((module, index) => (
              <tr key={module.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                <td className="p-4 font-medium">{module.label}</td>
                <td className="p-4 text-center">
                  <Checkbox
                    checked={permissions[module.id]?.can_view || false}
                    disabled
                  />
                </td>
                <td className="p-4 text-center">
                  <Checkbox
                    checked={permissions[module.id]?.can_create || false}
                    disabled
                  />
                </td>
                <td className="p-4 text-center">
                  <Checkbox
                    checked={permissions[module.id]?.can_edit || false}
                    disabled
                  />
                </td>
                <td className="p-4 text-center">
                  <Checkbox
                    checked={permissions[module.id]?.can_delete || false}
                    disabled
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
