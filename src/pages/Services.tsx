import PublicLayout from '@/components/layout/PublicLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Services = () => {
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Our Services</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Service 1</CardTitle>
              <CardDescription>Professional service offering</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Service details coming soon...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Services;
