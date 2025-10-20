import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Shield } from 'lucide-react';
import { PERMISSION_CATEGORIES } from '@/lib/permissions';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Role {
  id: string;
  name: string;
  description: string | null;
  is_system_role: boolean;
}

interface Permission {
  id: string;
  name: string;
  module: string;
  action: string;
  description: string | null;
}

export function RoleManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  // Fetch roles
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Role[];
    },
  });

  // Fetch all permissions
  const { data: permissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('module, action');
      
      if (error) throw error;
      return data as Permission[];
    },
  });

  // Fetch role permissions when editing
  const { data: rolePermissions } = useQuery({
    queryKey: ['role-permissions', editingRole?.id],
    enabled: !!editingRole,
    queryFn: async () => {
      if (!editingRole) return [];
      
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', editingRole.id);
      
      if (error) throw error;
      return data.map(rp => rp.permission_id);
    },
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (values: { name: string; description: string; permissions: string[] }) => {
      // Create role
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .insert({
          name: values.name,
          description: values.description,
          is_system_role: false,
        })
        .select()
        .single();

      if (roleError) throw roleError;

      // Add permissions
      if (values.permissions.length > 0) {
        const rolePermissions = values.permissions.map(permId => ({
          role_id: role.id,
          permission_id: permId,
        }));

        const { error: permError } = await supabase
          .from('role_permissions')
          .insert(rolePermissions);

        if (permError) throw permError;
      }

      return role;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({
        title: 'Role created',
        description: 'The role has been created successfully.',
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async (values: { id: string; name: string; description: string; permissions: string[] }) => {
      // Update role
      const { error: roleError } = await supabase
        .from('roles')
        .update({
          name: values.name,
          description: values.description,
        })
        .eq('id', values.id);

      if (roleError) throw roleError;

      // Delete existing permissions
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', values.id);

      if (deleteError) throw deleteError;

      // Add new permissions
      if (values.permissions.length > 0) {
        const rolePermissions = values.permissions.map(permId => ({
          role_id: values.id,
          permission_id: permId,
        }));

        const { error: permError } = await supabase
          .from('role_permissions')
          .insert(rolePermissions);

        if (permError) throw permError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast({
        title: 'Role updated',
        description: 'The role has been updated successfully.',
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({
        title: 'Role deleted',
        description: 'The role has been deleted successfully.',
      });
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setRoleName(role.name);
      setRoleDescription(role.description || '');
    } else {
      setEditingRole(null);
      setRoleName('');
      setRoleDescription('');
      setSelectedPermissions(new Set());
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
    setSelectedPermissions(new Set());
  };

  const handleSubmit = () => {
    if (!roleName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a role name.',
        variant: 'destructive',
      });
      return;
    }

    if (editingRole) {
      updateRoleMutation.mutate({
        id: editingRole.id,
        name: roleName,
        description: roleDescription,
        permissions: Array.from(selectedPermissions),
      });
    } else {
      createRoleMutation.mutate({
        name: roleName,
        description: roleDescription,
        permissions: Array.from(selectedPermissions),
      });
    }
  };

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (roleToDelete) {
      deleteRoleMutation.mutate(roleToDelete.id);
    }
  };

  // Update selected permissions when editing role
  if (editingRole && rolePermissions && selectedPermissions.size === 0) {
    setSelectedPermissions(new Set(rolePermissions));
  }

  const togglePermission = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const toggleCategory = (category: typeof PERMISSION_CATEGORIES[keyof typeof PERMISSION_CATEGORIES]) => {
    const categoryPermissionIds = permissions
      ?.filter(p => category.permissions.some(cp => cp.module === p.module && cp.action === p.action))
      .map(p => p.id) || [];

    const allSelected = categoryPermissionIds.every(id => selectedPermissions.has(id));
    const newSelected = new Set(selectedPermissions);

    if (allSelected) {
      categoryPermissionIds.forEach(id => newSelected.delete(id));
    } else {
      categoryPermissionIds.forEach(id => newSelected.add(id));
    }

    setSelectedPermissions(newSelected);
  };

  if (rolesLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Roles</h3>
          <p className="text-sm text-muted-foreground">
            Manage roles and their permissions
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
              <DialogDescription>
                {editingRole
                  ? 'Update the role details and permissions.'
                  : 'Create a new role with specific permissions.'}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Role Name</Label>
                  <Input
                    id="name"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g., Sales Manager"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    placeholder="Describe the role's responsibilities"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <div className="border rounded-lg p-4 space-y-4">
                    {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => {
                      const categoryPermissions = permissions?.filter(p =>
                        category.permissions.some(cp => cp.module === p.module && cp.action === p.action)
                      ) || [];
                      const allSelected = categoryPermissions.every(p => selectedPermissions.has(p.id));
                      const someSelected = categoryPermissions.some(p => selectedPermissions.has(p.id));

                      return (
                        <div key={key} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={key}
                              checked={allSelected}
                              onCheckedChange={() => toggleCategory(category)}
                              className={someSelected && !allSelected ? 'opacity-50' : ''}
                            />
                            <Label htmlFor={key} className="font-semibold cursor-pointer">
                              {category.name}
                            </Label>
                          </div>
                          <div className="ml-6 space-y-2">
                            {categoryPermissions.map((perm) => (
                              <div key={perm.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={perm.id}
                                  checked={selectedPermissions.has(perm.id)}
                                  onCheckedChange={() => togglePermission(perm.id)}
                                />
                                <Label htmlFor={perm.id} className="text-sm cursor-pointer">
                                  {perm.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingRole ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles?.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    {role.name}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {role.description || 'No description'}
                </TableCell>
                <TableCell>
                  {role.is_system_role ? (
                    <Badge variant="secondary">System</Badge>
                  ) : (
                    <Badge variant="outline">Custom</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(role)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {!role.is_system_role && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(role)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role "{roleToDelete?.name}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
