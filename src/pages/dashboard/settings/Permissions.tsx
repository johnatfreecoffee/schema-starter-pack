import { useState } from 'react';
import SettingsTabs from '@/components/layout/SettingsTabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleManagement } from '@/components/admin/team/RoleManagement';
import { PermissionsCatalog } from '@/components/admin/team/PermissionsCatalog';
import { Shield, Users } from 'lucide-react';

const Permissions = () => {
  const [activeTab, setActiveTab] = useState('roles');

  return (
    <ProtectedRoute requireAdmin>
      <div className="container mx-auto py-6">
        <SettingsTabs />
        
        <div className="mt-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Permissions & Roles</h1>
            <p className="text-muted-foreground mt-2">
              Manage user roles and permissions across your system
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Roles
              </TabsTrigger>
              <TabsTrigger value="permissions" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Permissions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="roles">
              <Card>
                <CardHeader>
                  <CardTitle>Role Management</CardTitle>
                  <CardDescription>
                    Create and manage roles with granular permission control
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RoleManagement />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="permissions">
              <Card>
                <CardHeader>
                  <CardTitle>Permission Matrix</CardTitle>
                  <CardDescription>
                    View all available permissions organized by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PermissionsCatalog />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Permissions;
