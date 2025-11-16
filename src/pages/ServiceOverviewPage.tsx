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
import { SEOHead } from '@/components/seo/SEOHead';
import { LocalBusinessSchema } from '@/components/seo/LocalBusinessSchema';

const ServiceOverviewPage = () => {
  const { serviceSlug } = useParams<{ serviceSlug: string }>();
  const { openModal } = useLeadFormModal();

  const { data: service, isLoading: serviceLoading, error: serviceError } = useCachedQuery({
    queryKey: ['service', serviceSlug],
    cacheKey: `services:${serviceSlug}`,
    cacheTTL: 60 * 60 * 1000, // 1 hour
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*, template:templates(*)')
        .eq('slug', serviceSlug)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    },
  });

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

  // Build page data for template rendering (without city-specific data)
  const pageData = service && company ? {
    service_name: service.name,
    service_slug: service.slug,
    service_description: service.full_description || '',
    service_starting_price: formatPrice(service.starting_price || 0),
    service_category: service.category,
    company_name: company.business_name,
    company_phone: formatPhone(company.phone),
    company_email: company.email,
    company_address: company.address,
    company_description: company.description || '',
    company_slogan: company.business_slogan || '',
    years_experience: company.years_experience || 0,
    logo_url: company.logo_url || '',
    icon_url: company.icon_url || '',
    // Placeholder for city-specific variables
    city_name: '[Select a city below]',
    city_slug: '',
    display_name: '',
    local_description: '',
  } : null;

  // Render template with async review variables
  const { data: renderedContent, isLoading: isRendering } = useQuery({
    queryKey: ['rendered-service', serviceSlug, pageData],
    queryFn: async () => {
      if (!service?.template?.template_html || !pageData) return '';
      
      let content = await renderTemplateWithReviews(
        service.template.template_html,
        pageData,
        { serviceId: service.id }
      );
      
      // content = sanitizeHtml(content); // Sanitization + CTA normalization handled by AIHTMLRenderer
      
      // Add lazy loading to images
      content = content.replace(
        /<img(?![^>]*loading=)/gi,
        '<img loading="lazy"'
      );
      
      return content;
    },
    enabled: !!(service?.template?.template_html && pageData),
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

  if (serviceError || !service || !company || !pageData) {
    return <NotFound />;
  }

  const canonicalUrl = `${window.location.origin}/services/${service.slug}`;

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

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-3">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link to="/" className="text-primary hover:underline">
                Home
              </Link>
            </li>
            <li className="text-muted-foreground">›</li>
            <li>
              <Link to="/services" className="text-primary hover:underline">
                Services
              </Link>
            </li>
            <li className="text-muted-foreground">›</li>
            <li className="font-medium" aria-current="page">
              {service.name}
            </li>
          </ol>
        </div>
      </nav>

      {/* Service Overview Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Hero CTA Section */}
        <div className="text-center mb-12 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-8 border">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{service.name} Services</h1>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            {service.full_description || `Professional ${service.name} services from ${company.business_name}`}
          </p>
          {service.starting_price && (
            <p className="text-2xl font-bold mb-6 text-primary">
              Starting at {formatPrice(service.starting_price)}
            </p>
          )}
          <Button 
            size="lg" 
            className="text-lg py-6 px-8"
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
            Get Your Free Quote
          </Button>
        </div>

        {renderedContent ? (
          <AIHTMLRenderer html={renderedContent} className="prose prose-lg max-w-none mb-12" />
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
