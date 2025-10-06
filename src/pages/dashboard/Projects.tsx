import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Projects = () => {
  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">Projects Management</h1>
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>Track active projects and their progress</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Projects functionality coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Projects;
