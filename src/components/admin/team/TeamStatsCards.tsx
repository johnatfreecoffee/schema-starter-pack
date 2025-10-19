import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Users, UserCheck, UserX, Mail, Shield, Briefcase, Wrench } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function TeamStatsCards() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    pending: 0,
    byRole: {} as Record<string, number>,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get all user profiles (excluding customers)
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, status');

      // Get roles for each user
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, roles(name)');

      // Get pending invitations
      const { data: invites } = await supabase
        .from('team_invitations')
        .select('id')
        .eq('status', 'pending');

      // Filter out customers
      const teamMembers = profiles?.filter(profile => {
        const userRole = userRoles?.find((r: any) => r.user_id === profile.id);
        return userRole?.roles?.name !== 'customer';
      }) || [];

      const active = teamMembers.filter(u => u.status === 'active').length;
      const suspended = teamMembers.filter(u => u.status === 'suspended').length;

      // Count by role
      const roleCount: Record<string, number> = {};
      teamMembers.forEach(profile => {
        const userRole = userRoles?.find((r: any) => r.user_id === profile.id);
        const roleName = userRole?.roles?.name || 'Unknown';
        if (roleName !== 'customer') {
          roleCount[roleName] = (roleCount[roleName] || 0) + 1;
        }
      });

      setStats({
        total: teamMembers.length,
        active,
        suspended,
        pending: invites?.length || 0,
        byRole: roleCount,
      });
    } catch (error) {
      console.error('Error loading team stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'Admin':
      case 'Super Admin':
        return Shield;
      case 'Sales Manager':
        return Briefcase;
      case 'Technician':
        return Wrench;
      default:
        return Users;
    }
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <h3 className="text-3xl font-bold mt-2">{stats.total}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <h3 className="text-3xl font-bold mt-2 text-green-600">{stats.active}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Suspended</p>
                <h3 className="text-3xl font-bold mt-2 text-red-600">{stats.suspended}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Invites</p>
                <h3 className="text-3xl font-bold mt-2 text-blue-600">{stats.pending}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Breakdown */}
      {Object.keys(stats.byRole).length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-4">Users by Role</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.byRole).map(([roleName, count]) => {
                const Icon = getRoleIcon(roleName);
                return (
                  <div key={roleName} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{roleName}</p>
                      <p className="text-xl font-semibold">{count}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
