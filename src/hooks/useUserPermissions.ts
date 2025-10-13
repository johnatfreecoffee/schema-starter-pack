import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';

interface ModulePermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const DEFAULT_PERMISSIONS: ModulePermissions = {
  canView: false,
  canCreate: false,
  canEdit: false,
  canDelete: false,
};

const ADMIN_PERMISSIONS: ModulePermissions = {
  canView: true,
  canCreate: true,
  canEdit: true,
  canDelete: true,
};

export function useUserPermissions(module: string) {
  const { role, loading: roleLoading } = useUserRole();
  const [permissions, setPermissions] = useState<ModulePermissions>(DEFAULT_PERMISSIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPermissions() {
      if (roleLoading) return;

      // Super Admin and Admin have all permissions
      if (role === 'Super Admin' || role === 'Admin') {
        setPermissions(ADMIN_PERMISSIONS);
        setLoading(false);
        return;
      }

      // Customers have no permissions
      if (role === 'customer') {
        setPermissions(DEFAULT_PERMISSIONS);
        setLoading(false);
        return;
      }

      // Other roles - fetch their permissions from role_permissions
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setPermissions(DEFAULT_PERMISSIONS);
          setLoading(false);
          return;
        }

        // Get user's role permissions
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (roleError || !roleData) {
          setPermissions(DEFAULT_PERMISSIONS);
          setLoading(false);
          return;
        }

        // Get permissions for this role and module
        const { data: permsData, error: permsError } = await supabase
          .from('role_permissions')
          .select('permissions(name, action)')
          .eq('role_id', roleData.role_id);

        if (permsError || !permsData) {
          setPermissions({ ...DEFAULT_PERMISSIONS, canView: true });
          setLoading(false);
          return;
        }

        // Parse permissions for this module
        const modulePerms: ModulePermissions = { ...DEFAULT_PERMISSIONS };
        permsData.forEach((item: any) => {
          const perm = item.permissions;
          if (perm && perm.name.startsWith(module + '.')) {
            if (perm.action === 'view') modulePerms.canView = true;
            if (perm.action === 'create') modulePerms.canCreate = true;
            if (perm.action === 'edit') modulePerms.canEdit = true;
            if (perm.action === 'delete') modulePerms.canDelete = true;
          }
        });

        setPermissions(modulePerms);
      } catch (error) {
        console.error('Error in useUserPermissions:', error);
        setPermissions(DEFAULT_PERMISSIONS);
      } finally {
        setLoading(false);
      }
    }

    loadPermissions();
  }, [module, role, roleLoading]);

  return {
    ...permissions,
    loading,
    hasAccess: permissions.canView,
  };
}
