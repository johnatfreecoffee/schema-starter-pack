import AdminLayout from '@/components/layout/AdminLayout';
import SettingsTabs from '@/components/layout/SettingsTabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AITraining = () => {
  return (
    <AdminLayout>
      <SettingsTabs />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">AI Training</h1>
        <Card>
          <CardHeader>
            <CardTitle>AI Training Data</CardTitle>
            <CardDescription>Configure AI learning and training parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">AI training functionality coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AITraining;
