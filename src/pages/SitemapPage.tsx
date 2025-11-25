import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/seo/SEOHead';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface ServiceArea {
  id: string;
  city_name: string;
  city_slug: string;
  display_name: string;
}

interface Service {
  id: string;
  name: string;
  slug: string;
  category: string;
}

interface GeneratedPage {
  url_path: string;
  page_title: string;
}

const SitemapPage = () => {
  // Fetch all service areas
  const { data: serviceAreas, isLoading: loadingAreas } = useQuery({
    queryKey: ['service-areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_areas')
        .select('*')
        .eq('status', true)
        .order('city_name');

      if (error) throw error;
      return data as ServiceArea[];
    },
  });

  // Fetch all services
  const { data: services, isLoading: loadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, slug, category')
        .eq('is_active', true)
        .eq('archived', false)
        .order('name');

      if (error) throw error;
      return data as Service[];
    },
  });

  // Group services by category
  const servicesByCategory = services?.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const isLoading = loadingAreas || loadingServices;

  return (
    <>
      <SEOHead
        title="Complete Service Directory | ClearHome Roofing & Contracting"
        description="Browse our complete directory of roofing and contracting services across all Louisiana service areas. Find the exact service you need in your city."
        canonical={`${window.location.origin}/sitemap`}
        metaRobots="index,follow"
      />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Service Directory
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Browse all our roofing and contracting services across Louisiana. Click any service to view location-specific information.
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Services by Category */}
              <div className="space-y-12 mb-16">
                <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-primary pb-2">
                  Services by Category
                </h2>
                {servicesByCategory && Object.entries(servicesByCategory).map(([category, categoryServices]) => (
                  <div key={category} className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800">
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryServices.map((service) => (
                        <Link
                          key={service.id}
                          to={`/services/${service.slug}`}
                          className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all"
                        >
                          <h4 className="font-medium text-gray-900 hover:text-primary">
                            {service.name}
                          </h4>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Services by Location */}
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-primary pb-2">
                  Services by Location
                </h2>
                {serviceAreas && serviceAreas.map((area) => (
                  <div key={area.id} className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                      <span className="inline-block w-2 h-2 bg-primary rounded-full mr-3"></span>
                      {area.display_name || area.city_name}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pl-5">
                      {services?.map((service) => (
                        <Link
                          key={`${service.id}-${area.id}`}
                          to={`/services/${service.slug}/${area.city_slug}`}
                          className="text-sm text-gray-600 hover:text-primary hover:underline transition-colors"
                        >
                          {service.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-center text-gray-700">
                  <strong>{services?.length || 0}</strong> services across{' '}
                  <strong>{serviceAreas?.length || 0}</strong> locations ={' '}
                  <strong>{(services?.length || 0) * (serviceAreas?.length || 0)}</strong> unique service pages
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default SitemapPage;
