import AdminLayout from '@/components/layout/AdminLayout';
import SettingsTabs from '@/components/layout/SettingsTabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ServicesSettings = () => {
  return (
    <AdminLayout>
      <SettingsTabs />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">Services Management</h1>
        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
            <CardDescription>Configure your service offerings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Services management functionality coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ServicesSettings;
