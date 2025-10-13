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
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const permissionsMap: Record<string, Permission> = {};
      
      // Initialize all modules with default permissions
      MODULES.forEach(module => {
        permissionsMap[module.id] = {
          module: module.id,
          can_view: userRole === 'Super Admin' || userRole === 'Admin',
          can_create: userRole === 'Super Admin' || userRole === 'Admin',
          can_edit: userRole === 'Super Admin' || userRole === 'Admin',
          can_delete: userRole === 'Super Admin' || userRole === 'Admin',
        };
      });

      // Override with existing permissions
      data?.forEach(perm => {
        permissionsMap[perm.module] = {
          module: perm.module,
          can_view: perm.can_view,
          can_create: perm.can_create,
          can_edit: perm.can_edit,
          can_delete: perm.can_delete,
        };
      });

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

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Delete existing permissions
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId);

      // Insert new permissions
      const permissionsToInsert = Object.values(permissions).map(perm => ({
        user_id: userId,
        module: perm.module,
        can_view: perm.can_view,
        can_create: perm.can_create,
        can_edit: perm.can_edit,
        can_delete: perm.can_delete,
      }));

      const { error } = await supabase
        .from('user_permissions')
        .insert(permissionsToInsert);

      if (error) throw error;

      // Log the permissions change
      await CRUDLogger.logUpdate({
        userId: user.id,
        entityType: 'account',
        entityId: userId,
        entityName: 'User Permissions',
        changes: {
          permissions: {
            old: 'previous_permissions',
            new: 'updated_permissions',
          },
        },
      });

      toast({
        title: 'Success',
        description: 'Permissions updated successfully',
      });
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to save permissions',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

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
      {isAdmin && (
        <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
          Admin users have all permissions by default and cannot be modified.
        </div>
      )}

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
                    onCheckedChange={(checked) => handlePermissionChange(module.id, 'can_view', checked as boolean)}
                    disabled={isAdmin}
                  />
                </td>
                <td className="p-4 text-center">
                  <Checkbox
                    checked={permissions[module.id]?.can_create || false}
                    onCheckedChange={(checked) => handlePermissionChange(module.id, 'can_create', checked as boolean)}
                    disabled={isAdmin}
                  />
                </td>
                <td className="p-4 text-center">
                  <Checkbox
                    checked={permissions[module.id]?.can_edit || false}
                    onCheckedChange={(checked) => handlePermissionChange(module.id, 'can_edit', checked as boolean)}
                    disabled={isAdmin}
                  />
                </td>
                <td className="p-4 text-center">
                  <Checkbox
                    checked={permissions[module.id]?.can_delete || false}
                    onCheckedChange={(checked) => handlePermissionChange(module.id, 'can_delete', checked as boolean)}
                    disabled={isAdmin}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isAdmin && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Permissions
          </Button>
        </div>
      )}
    </div>
  );
}
