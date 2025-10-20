import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';

interface UserPermission {
  module: string;
  action: string;
  permission_name: string;
}

export function usePermissions() {
  const { role, loading: roleLoading } = useUserRole();
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPermissions() {
      if (roleLoading) return;

      // Super Admin and Admin have all permissions
      if (role === 'Super Admin' || role === 'Admin') {
        setPermissions([{ module: '*', action: '*', permission_name: 'admin' }]);
        setLoading(false);
        return;
      }

      // Customers have no admin permissions
      if (role === 'customer' || !role) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setPermissions([]);
          setLoading(false);
          return;
        }

        // Fetch user permissions using the database function
        const { data, error } = await supabase.rpc('get_user_permissions', {
          _user_id: user.id
        });

        if (error) {
          console.error('Error loading permissions:', error);
          setPermissions([]);
        } else {
          setPermissions(data || []);
        }
      } catch (error) {
        console.error('Error in usePermissions:', error);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    }

    loadPermissions();
  }, [role, roleLoading]);

  // Check if user has a specific permission
  const hasPermission = (module: string, action: string): boolean => {
    if (loading) return false;
    
    // Admin has all permissions
    if (permissions.some(p => p.module === '*' && p.action === '*')) {
      return true;
    }

    // Check specific permission
    return permissions.some(
      p => p.module === module && p.action === action
    );
  };

  // Check if user has any permission in a module
  const hasModuleAccess = (module: string): boolean => {
    if (loading) return false;
    
    // Admin has all permissions
    if (permissions.some(p => p.module === '*' && p.action === '*')) {
      return true;
    }

    // Check if user has any permission for this module
    return permissions.some(p => p.module === module);
  };

  // Check if user can view a module
  const canView = (module: string): boolean => {
    return hasPermission(module, 'view');
  };

  // Check if user can create in a module
  const canCreate = (module: string): boolean => {
    return hasPermission(module, 'create');
  };

  // Check if user can edit in a module
  const canEdit = (module: string): boolean => {
    return hasPermission(module, 'edit');
  };

  // Check if user can delete in a module
  const canDelete = (module: string): boolean => {
    return hasPermission(module, 'delete');
  };

  return {
    permissions,
    loading,
    hasPermission,
    hasModuleAccess,
    canView,
    canCreate,
    canEdit,
    canDelete,
    isAdmin: role === 'Super Admin' || role === 'Admin',
  };
}
