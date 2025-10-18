import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { StarRating } from '@/components/reviews/StarRating';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Services = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServicesWithReviews();
  }, []);

  async function loadServicesWithReviews() {
    setLoading(true);
    
    // Fetch all services
    const { data: servicesData } = await supabase
      .from('services')
      .select('*')
      .order('name');

    if (servicesData) {
      // For each service, get review stats
      const servicesWithStats = await Promise.all(
        servicesData.map(async (service) => {
          const { data: reviews } = await supabase
            .from('reviews')
            .select('rating')
            .eq('service_id', service.id)
            .eq('status', 'approved')
            .eq('display_on_website', true);

          const reviewCount = reviews?.length || 0;
          const avgRating = reviewCount > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
            : 0;

          return {
            ...service,
            reviewCount,
            avgRating
          };
        })
      );

      setServices(servicesWithStats);
    }
    
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Loading services...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Our Services</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional services backed by customer satisfaction
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {service.name}
                  {service.reviewCount > 0 && (
                    <div className="flex items-center gap-1">
                      <StarRating rating={service.avgRating} size="sm" />
                      <span className="text-sm text-muted-foreground ml-1">
                        ({service.reviewCount})
                      </span>
                    </div>
                  )}
                </CardTitle>
                <CardDescription>
                  {service.category && (
                    <span className="inline-block bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                      {service.category}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  {service.full_description || service.short_description || 'Professional service offering'}
                </p>
                
                {service.starting_price && (
                  <p className="text-sm font-semibold">
                    Starting at ${(service.starting_price / 100).toFixed(2)}
                  </p>
                )}

                <div className="flex gap-2">
                  {service.reviewCount > 0 ? (
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link to={`/reviews?service=${service.id}`}>
                        View Reviews
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild variant="outline" size="sm" className="flex-1" disabled>
                      <span>No Reviews Yet</span>
                    </Button>
                  )}
                  <Button asChild size="sm" className="flex-1">
                    <Link to="/contact">Get Quote</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {services.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No services available at this time.</p>
          </div>
        )}
      </div>
  );
};

export default Services;
