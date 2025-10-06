import AdminLayout from '@/components/layout/AdminLayout';
import SettingsTabs from '@/components/layout/SettingsTabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const SiteSettings = () => {
  return (
    <AdminLayout>
      <SettingsTabs />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">Site Settings</h1>
        <Card>
          <CardHeader>
            <CardTitle>Website Configuration</CardTitle>
            <CardDescription>Manage general site settings and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Site settings functionality coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default SiteSettings;
