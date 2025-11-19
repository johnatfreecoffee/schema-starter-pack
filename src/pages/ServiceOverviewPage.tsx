import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import NotFound from './NotFound';
import { renderTemplateWithReviews, formatPrice, formatPhone } from '@/lib/templateEngine';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLeadFormModal } from '@/hooks/useLeadFormModal';
import { MessageSquare } from 'lucide-react';
import AIHTMLRenderer from '@/components/ai/AIHTMLRenderer';
import SiteHTMLIframeRenderer from '@/components/ai/SiteHTMLIframeRenderer';
import { SEOHead } from '@/components/seo/SEOHead';
import { LocalBusinessSchema } from '@/components/seo/LocalBusinessSchema';

const ServiceOverviewPage = () => {
  const { serviceSlug } = useParams<{ serviceSlug: string }>();
  const { openModal } = useLeadFormModal();
  const urlPath = `/services/${serviceSlug}`;

  // Fetch server-rendered content via backend function (same as GeneratedPage but without city)
  const { data: pageContent, isLoading: isRendering, error: renderError } = useQuery({
    queryKey: ['rendered-service-overview', serviceSlug],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('render-page', {
        body: { urlPath: `/services/${serviceSlug}` },
      });
      
      if (error) throw error;
      return data;
    },
    enabled: !!serviceSlug, // Only run when serviceSlug is available
  });

  const service = pageContent?.pageData?.service;
  const serviceError = renderError;
  const serviceLoading = isRendering;

  const renderedContent = pageContent?.content;

  const { data: serviceAreas, isLoading: areasLoading } = useCachedQuery({
    queryKey: ['service-areas', service?.id],
    cacheKey: `service-areas:${service?.id}`,
    cacheTTL: 60 * 60 * 1000, // 1 hour
    queryFn: async () => {
      if (!service?.id) return [];
      
      const { data, error } = await supabase
        .from('generated_pages')
        .select(`
          *,
          service_area:service_areas(*)
        `)
        .eq('service_id', service.id)
        .eq('status', true);

      if (error) throw error;
      return data;
    },
    enabled: !!service?.id,
  });

  const { data: company } = useCachedQuery({
    queryKey: ['company-settings'],
    cacheKey: 'company:settings',
    cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (serviceLoading || areasLoading || isRendering) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (serviceError || !service || !company) {
    return <NotFound />;
  }

  const canonicalUrl = `${window.location.origin}/services/${service.slug}`;
  
  // Check if content needs iframe rendering (full HTML document)
  const needsIframe = renderedContent && (
    renderedContent.includes('<!DOCTYPE') || renderedContent.includes('<html')
  );

  return (
    <>
      {/* SEO Meta Tags */}
      <SEOHead
        title={`${service.name} Services | ${company.business_name}`}
        description={service.full_description || `Professional ${service.name} services from ${company.business_name}`}
        canonical={canonicalUrl}
        ogImage={company.logo_url}
      />
      <LocalBusinessSchema
        businessName={company.business_name}
        description={company.description}
        address={company.address}
        phone={company.phone}
        email={company.email}
        url={window.location.origin}
        logo={company.logo_url}
        services={[service.name]}
      />

      {/* Service Overview Content */}
      <div>

        {renderedContent ? (
          needsIframe ? (
            <SiteHTMLIframeRenderer html={renderedContent} />
          ) : (
            <AIHTMLRenderer html={renderedContent} className="prose prose-lg max-w-none mb-12" />
          )
        ) : (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">About Our {service.name} Services</h2>
            <p className="text-muted-foreground">
              {service.full_description}
            </p>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="bg-muted/30 rounded-lg p-8 text-center mb-12">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-6">
            Request a free quote and we'll get back to you within 24 hours
          </p>
          <Button 
            size="lg"
            onClick={() => openModal(
              `Get a Free Quote for ${service.name}`,
              {
                serviceId: service.id,
                serviceName: service.name,
                originatingUrl: window.location.href,
              }
            )}
          >
            <MessageSquare className="mr-2 h-5 w-5" />
            Request Service
          </Button>
        </div>

        {/* Service Areas */}
        {serviceAreas && serviceAreas.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Available Service Areas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceAreas.map((area) => (
                <Card key={area.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>{area.service_area.display_name || area.service_area.city_name}</CardTitle>
                    {area.service_area.local_description && (
                      <CardDescription className="line-clamp-2">
                        {area.service_area.local_description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <Link to={`/services/${serviceSlug}/${area.service_area.city_slug}`}>
                        View {service.name} in {area.service_area.city_name}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ServiceOverviewPage;
