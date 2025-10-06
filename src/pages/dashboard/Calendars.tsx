import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Calendars = () => {
  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">Calendar</h1>
        <Card>
          <CardHeader>
            <CardTitle>Calendar Events</CardTitle>
            <CardDescription>View and manage appointments and events</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Calendar functionality coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Calendars;
