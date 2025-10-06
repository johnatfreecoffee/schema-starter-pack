import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              CRM & Website Platform
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Manage your business, track leads, and grow your customer relationships all in one place
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8">
                Get Started
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Login
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 rounded-lg bg-card border border-border shadow-lg">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Lead Management</h3>
              <p className="text-muted-foreground">
                Capture, track, and convert leads efficiently with our powerful CRM tools
              </p>
            </div>

            <div className="p-6 rounded-lg bg-card border border-border shadow-lg">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">Project Tracking</h3>
              <p className="text-muted-foreground">
                Keep all your projects organized and on schedule with comprehensive tools
              </p>
            </div>

            <div className="p-6 rounded-lg bg-card border border-border shadow-lg">
              <div className="text-4xl mb-4">💼</div>
              <h3 className="text-xl font-semibold mb-2">Customer Portal</h3>
              <p className="text-muted-foreground">
                Provide your customers with a seamless portal to track their projects
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
