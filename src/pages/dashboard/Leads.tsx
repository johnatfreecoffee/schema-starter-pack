import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Leads = () => {
  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">Leads Management</h1>
        <Card>
          <CardHeader>
            <CardTitle>Leads</CardTitle>
            <CardDescription>Manage incoming leads and convert them to accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Leads functionality coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Leads;
