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

      // Admins have all permissions
      if (role === 'admin') {
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

      // CRM users - fetch their specific permissions
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setPermissions(DEFAULT_PERMISSIONS);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_permissions')
          .select('can_view, can_create, can_edit, can_delete')
          .eq('user_id', user.id)
          .eq('module', module)
          .maybeSingle();

        if (error) {
          console.error('Error fetching permissions:', error);
          setPermissions(DEFAULT_PERMISSIONS);
        } else if (data) {
          setPermissions({
            canView: data.can_view,
            canCreate: data.can_create,
            canEdit: data.can_edit,
            canDelete: data.can_delete,
          });
        } else {
          // No specific permissions set, default to view only
          setPermissions({ ...DEFAULT_PERMISSIONS, canView: true });
        }
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
