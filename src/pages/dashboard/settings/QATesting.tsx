import AdminLayout from '@/components/layout/AdminLayout';
import SettingsTabs from '@/components/layout/SettingsTabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const QATesting = () => {
  return (
    <AdminLayout>
      <SettingsTabs />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">QA Testing</h1>
        <Card>
          <CardHeader>
            <CardTitle>Quality Assurance</CardTitle>
            <CardDescription>Test and validate system functionality</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">QA testing functionality coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default QATesting;
