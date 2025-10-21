import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import NotFound from './NotFound';
import { renderTemplateWithReviews, formatPrice, formatPhone } from '@/lib/templateEngine';
import { ServiceReviews } from '@/components/reviews/ServiceReviews';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { Button } from '@/components/ui/button';
import { useLeadFormModal } from '@/hooks/useLeadFormModal';
import { MessageSquare } from 'lucide-react';
import { sanitizeHtml } from '@/lib/sanitize';
import { SEOHead } from '@/components/seo/SEOHead';
import { LocalBusinessSchema } from '@/components/seo/LocalBusinessSchema';

const GeneratedPage = () => {
  const { citySlug, serviceSlug } = useParams<{ citySlug: string; serviceSlug: string }>();
  const urlPath = `/${citySlug}/${serviceSlug}`;
  const { openModal } = useLeadFormModal();

  const { data: page, isLoading, error } = useCachedQuery({
    queryKey: ['generated-page', urlPath],
    cacheKey: `pages:generated:${urlPath}`,
    cacheTTL: 60 * 60 * 1000, // 1 hour
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_pages')
        .select('*')
        .eq('url_path', urlPath)
        .eq('status', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Fetch related records separately to avoid RLS join issues
  const { data: service } = useCachedQuery({
    queryKey: ['service', page?.service_id],
    cacheKey: page?.service_id ? `services:${page.service_id}` : undefined,
    cacheTTL: 60 * 60 * 1000, // 1 hour
    enabled: !!page?.service_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*, template:templates(*)')
        .eq('id', page!.service_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: area } = useCachedQuery({
    queryKey: ['service-area', page?.service_area_id],
    cacheKey: page?.service_area_id ? `service-areas:${page.service_area_id}` : undefined,
    cacheTTL: 60 * 60 * 1000, // 1 hour
    enabled: !!page?.service_area_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_areas')
        .select('*')
        .eq('id', page!.service_area_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
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

  // Build page data for template rendering
  const pageData = page && company && service && area ? {
    service_name: service.name,
    service_slug: service.slug,
    service_description: service.full_description || '',
    service_starting_price: formatPrice(service.starting_price || 0),
    service_category: service.category,
    city_name: area.city_name,
    city_slug: area.city_slug,
    display_name: area.display_name,
    local_description: area.local_description || '',
    company_name: company.business_name,
    company_phone: formatPhone(company.phone),
    company_email: company.email,
    company_address: company.address,
    company_description: company.description || '',
    company_slogan: company.business_slogan || '',
    years_experience: company.years_experience || 0,
    logo_url: company.logo_url || '',
    icon_url: company.icon_url || '',
    page_title: page.page_title,
    meta_description: page.meta_description || '',
    url_path: page.url_path,
  } : null;

  // Render template with async review variables
  const { data: renderedContent, isLoading: isRendering } = useQuery({
    queryKey: ['rendered-page', urlPath, pageData],
    queryFn: async () => {
      if (!page || !pageData) return '';
      
      let content = await renderTemplateWithReviews(
        page.service.template.template_html,
        pageData,
        { serviceId: page.service_id }
      );
      
      content = sanitizeHtml(content);
      
      // Add lazy loading to images in rendered HTML
      content = content.replace(
        /<img(?![^>]*loading=)/gi,
        '<img loading="lazy"'
      );
      
      return content;
    },
    enabled: !!(page && pageData),
  });

  if (isLoading || isRendering) {
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

  if (error || !page || !company || !pageData) {
    return <NotFound />;
  }

  // Track view (fire and forget)
  supabase
    .from('generated_pages')
    .update({
      view_count: (page.view_count || 0) + 1,
      last_viewed_at: new Date().toISOString(),
    })
    .eq('id', page.id)
    .then(() => {});

  const canonicalUrl = `${window.location.origin}${pageData.url_path}`;

  return (
    <>
      {/* SEO Meta Tags */}
      <SEOHead
        title={pageData.page_title}
        description={pageData.meta_description}
        canonical={canonicalUrl}
        ogTitle={pageData.page_title}
        ogDescription={pageData.meta_description}
        ogUrl={canonicalUrl}
        ogImage={company.logo_url}
        twitterTitle={pageData.page_title}
        twitterDescription={pageData.meta_description}
        twitterImage={company.logo_url}
      />

      {/* LocalBusiness Schema */}
      <LocalBusinessSchema
        businessName={pageData.company_name}
        description={pageData.company_description}
        address={pageData.company_address}
        phone={pageData.company_phone}
        email={pageData.company_email}
        url={window.location.origin}
        logo={pageData.logo_url}
        serviceArea={[pageData.city_name]}
        services={[pageData.service_name]}
      />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-3">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <a href="/" className="text-primary hover:underline">
                Home
              </a>
            </li>
            <li className="text-muted-foreground">›</li>
            <li>
              <a href="/services" className="text-primary hover:underline">
                Services
              </a>
            </li>
            <li className="text-muted-foreground">›</li>
            <li>
              <a href={`/services/${pageData.service_slug}`} className="text-primary hover:underline">
                {pageData.service_name}
              </a>
            </li>
            <li className="text-muted-foreground">›</li>
            <li className="font-medium" aria-current="page">
              {pageData.city_name}
            </li>
          </ol>
        </div>
      </nav>

      {/* Hero CTA Section */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 border-b">
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {pageData.service_name} in {pageData.city_name}
          </h1>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Professional {pageData.service_name} services serving {pageData.city_name} and surrounding areas
          </p>
          <Button 
            size="lg"
            className="text-lg py-6 px-8"
            onClick={() => openModal(
              `Get a Free Quote for ${pageData.service_name} in ${pageData.city_name}`,
              {
                serviceId: page.service_id,
                serviceName: pageData.service_name,
                city: pageData.city_name,
                originatingUrl: window.location.href,
              }
            )}
          >
            <MessageSquare className="mr-2 h-5 w-5" />
            Get Your Free Quote
          </Button>
        </div>
      </div>

      {/* Rendered Content */}
      <div
        className="container mx-auto px-4 py-8 prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: renderedContent }}
      />

      {/* Bottom CTA Section */}
      <div className="bg-muted/30 border-y">
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready for Expert {pageData.service_name} in {pageData.city_name}?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Contact us today for a free consultation and quote
          </p>
          <Button 
            size="lg"
            onClick={() => openModal(
              `Get a Free Quote for ${pageData.service_name} in ${pageData.city_name}`,
              {
                serviceId: page.service_id,
                serviceName: pageData.service_name,
                city: pageData.city_name,
                originatingUrl: window.location.href,
              }
            )}
          >
            <MessageSquare className="mr-2 h-5 w-5" />
            Request Service Now
          </Button>
        </div>
      </div>

      {/* Service Reviews Section */}
      {page.service_id && (
        <ServiceReviews 
          serviceId={page.service_id} 
          serviceName={page.service.name}
        />
      )}
    </>
  );
};

export default GeneratedPage;

