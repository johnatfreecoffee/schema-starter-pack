import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Logs = () => {
  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">Activity Logs</h1>
        <Card>
          <CardHeader>
            <CardTitle>Action Logs</CardTitle>
            <CardDescription>View system activity and audit trail</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Activity logs functionality coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Logs;
