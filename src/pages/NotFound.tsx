import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
          <h2 className="mb-4 text-3xl font-bold">Page Not Found</h2>
          <p className="mb-8 text-xl text-muted-foreground">
            The page you're looking for doesn't exist or is currently unavailable.
          </p>
          
          <div className="bg-muted/30 rounded-lg p-8 mb-8">
            <h3 className="text-xl font-semibold mb-4">Try these instead:</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="default" size="lg">
                <a href="/">Go to Homepage</a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="/services">View All Services</a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="/contact">Contact Us</a>
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            If you believe this is an error, please <a href="/contact" className="text-primary hover:underline">contact us</a>.
          </p>
        </div>
      </div>
    </PublicLayout>
  );
};

export default NotFound;
