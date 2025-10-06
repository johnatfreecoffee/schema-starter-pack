import PublicLayout from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-background via-secondary to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              CRM & Website Platform
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful tools for managing your business, clients, and online presence all in one place.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild size="lg">
                <Link to="/auth">Get Started</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/services">View Services</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-xl bg-card border shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-2xl font-semibold mb-4">Lead Management</h3>
              <p className="text-muted-foreground">
                Capture, track, and convert leads efficiently with our powerful CRM tools
              </p>
            </div>

            <div className="p-8 rounded-xl bg-card border shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-2xl font-semibold mb-4">Project Tracking</h3>
              <p className="text-muted-foreground">
                Keep all your projects organized and on schedule with comprehensive tools
              </p>
            </div>

            <div className="p-8 rounded-xl bg-card border shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">💼</div>
              <h3 className="text-2xl font-semibold mb-4">Customer Portal</h3>
              <p className="text-muted-foreground">
                Provide your customers with a seamless portal to track their projects
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Index;
