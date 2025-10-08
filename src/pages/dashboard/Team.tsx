import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InviteUserDialog } from '@/components/admin/team/InviteUserDialog';
import { UserDetailDialog } from '@/components/admin/team/UserDetailDialog';
import { UserRoleBadge } from '@/components/admin/team/UserRoleBadge';
import { UserStatusBadge } from '@/components/admin/team/UserStatusBadge';
import { toast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { UserPlus, Search, Lock, Loader2, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CRUDLogger } from '@/lib/crudLogger';

interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  job_title: string | null;
  status: 'active' | 'suspended';
  last_login_at: string | null;
  role: 'admin' | 'crm_user' | 'customer';
  created_at: string;
}

interface PendingInvite {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'crm_user';
  job_title: string | null;
  created_at: string;
  invite_expires_at: string;
}

const Team = () => {
  const { role, loading: roleLoading } = useUserRole();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'suspend' | 'reactivate' | 'delete' | null>(null);

  useEffect(() => {
    if (!roleLoading) {
      loadTeamData();
    }
  }, [roleLoading]);

  const loadTeamData = async () => {
    setLoading(true);
    try {
      // Load team members (users with profiles and roles, excluding customers)
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get roles for each user
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['admin', 'crm_user']);

      if (rolesError) throw rolesError;

      const members: TeamMember[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        
        return {
          id: profile.id,
          email: profile.email || '',
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          phone: profile.phone,
          job_title: profile.job_title,
          status: profile.status as 'active' | 'suspended',
          last_login_at: profile.last_login_at,
          role: (userRole?.role || 'customer') as 'admin' | 'crm_user' | 'customer',
          created_at: profile.created_at,
        };
      }).filter(m => m.role !== 'customer');

      setTeamMembers(members);

      // Load pending invitations
      const { data: invites, error: invitesError } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (invitesError) throw invitesError;
      
      const typedInvites: PendingInvite[] = (invites || []).map(inv => ({
        id: inv.id,
        email: inv.email,
        full_name: inv.full_name,
        role: inv.role as 'admin' | 'crm_user',
        job_title: inv.job_title,
        created_at: inv.created_at,
        invite_expires_at: inv.invite_expires_at,
      }));
      
      setPendingInvites(typedInvites);
    } catch (error: any) {
      console.error('Error loading team data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load team members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Access control check
  if (roleLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (role !== 'admin') {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Lock className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            Only administrators can manage team members.
          </p>
          <Button onClick={() => window.history.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setUserDetailOpen(true);
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(filteredMembers.map(m => m.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.size === 0) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (bulkAction === 'delete') {
        const { error } = await supabase
          .from('user_profiles')
          .delete()
          .in('id', Array.from(selectedUsers));

        if (error) throw error;

        // Log deletions
        for (const userId of selectedUsers) {
          const member = teamMembers.find(m => m.id === userId);
          if (member) {
            await CRUDLogger.logDelete({
              userId: user.id,
              entityType: 'account',
              entityId: userId,
              entityName: member.full_name,
            });
          }
        }
      } else {
        const newStatus = bulkAction === 'suspend' ? 'suspended' : 'active';
        const { error } = await supabase
          .from('user_profiles')
          .update({ status: newStatus })
          .in('id', Array.from(selectedUsers));

        if (error) throw error;

        // Log status changes
        for (const userId of selectedUsers) {
          const member = teamMembers.find(m => m.id === userId);
          if (member) {
            await CRUDLogger.logStatusChange({
              userId: user.id,
              entityType: 'account',
              entityId: userId,
              entityName: member.full_name,
              oldStatus: member.status,
              newStatus,
            });
          }
        }
      }

      toast({
        title: 'Success',
        description: `Successfully ${bulkAction === 'delete' ? 'deleted' : bulkAction === 'suspend' ? 'suspended' : 'reactivated'} ${selectedUsers.size} user(s)`,
      });

      setSelectedUsers(new Set());
      setBulkActionDialogOpen(false);
      setBulkAction(null);
      loadTeamData();
    } catch (error: any) {
      console.error('Error performing bulk action:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform bulk action',
        variant: 'destructive',
      });
    }
  };

  // Filter team members
  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch =
      member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Team Management</h1>
            <p className="text-muted-foreground">
              Manage your team members, roles, and permissions
            </p>
          </div>
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        </div>

        {/* Filters and Bulk Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="crm_user">CRM User</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          {selectedUsers.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Bulk Actions ({selectedUsers.size})
                  <MoreVertical className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => { setBulkAction('suspend'); setBulkActionDialogOpen(true); }}>
                  Suspend Users
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setBulkAction('reactivate'); setBulkActionDialogOpen(true); }}>
                  Reactivate Users
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setBulkAction('delete'); setBulkActionDialogOpen(true); }} className="text-destructive">
                  Delete Users
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Pending Invitations */}
        {pendingInvites.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Pending Invitations ({pendingInvites.length})</h2>
            <div className="bg-card border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Invited</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium">{invite.full_name}</TableCell>
                      <TableCell>{invite.email}</TableCell>
                      <TableCell>
                        <UserRoleBadge role={invite.role} />
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(invite.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(invite.invite_expires_at), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Team Members Table */}
        <div className="bg-card border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.size === filteredMembers.length && filteredMembers.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No team members found
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                  <TableRow key={member.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedUsers.has(member.id)}
                        onCheckedChange={(checked) => handleSelectUser(member.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell onClick={() => handleUserClick(member.id)}>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback>
                            {member.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.full_name}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                          {member.job_title && (
                            <div className="text-xs text-muted-foreground">{member.job_title}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell onClick={() => handleUserClick(member.id)}>
                      <UserRoleBadge role={member.role} />
                    </TableCell>
                    <TableCell onClick={() => handleUserClick(member.id)}>
                      <UserStatusBadge status={member.status} />
                    </TableCell>
                    <TableCell onClick={() => handleUserClick(member.id)}>
                      {member.last_login_at
                        ? formatDistanceToNow(new Date(member.last_login_at), { addSuffix: true })
                        : 'Never'}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => handleUserClick(member.id)}>
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={loadTeamData}
      />

      <UserDetailDialog
        open={userDetailOpen}
        onOpenChange={setUserDetailOpen}
        userId={selectedUserId}
        onSuccess={loadTeamData}
      />

      <AlertDialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {bulkAction} {selectedUsers.size} user(s)? 
              {bulkAction === 'delete' && ' This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkAction}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default Team;
