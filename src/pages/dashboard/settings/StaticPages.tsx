import AdminLayout from '@/components/layout/AdminLayout';
import SettingsTabs from '@/components/layout/SettingsTabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const StaticPages = () => {
  return (
    <AdminLayout>
      <SettingsTabs />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">Static Pages</h1>
        <Card>
          <CardHeader>
            <CardTitle>Page Management</CardTitle>
            <CardDescription>Create and manage static website pages</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Static pages functionality coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default StaticPages;
