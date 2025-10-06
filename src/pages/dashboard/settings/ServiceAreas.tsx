import AdminLayout from '@/components/layout/AdminLayout';
import SettingsTabs from '@/components/layout/SettingsTabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ServiceAreas = () => {
  return (
    <AdminLayout>
      <SettingsTabs />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">Service Areas</h1>
        <Card>
          <CardHeader>
            <CardTitle>Coverage Areas</CardTitle>
            <CardDescription>Manage your service coverage locations</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Service areas functionality coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ServiceAreas;
