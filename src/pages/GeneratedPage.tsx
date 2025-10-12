import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PublicLayout from '@/components/layout/PublicLayout';
import NotFound from './NotFound';
import { renderTemplate, formatPrice, formatPhone } from '@/lib/templateEngine';
import { ServiceReviews } from '@/components/reviews/ServiceReviews';

const GeneratedPage = () => {
  const { citySlug, serviceSlug } = useParams<{ citySlug: string; serviceSlug: string }>();
  const urlPath = `/${citySlug}/${serviceSlug}`;

  const { data: page, isLoading, error } = useQuery({
    queryKey: ['generated-page', urlPath],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_pages')
        .select(`
          *,
          service:services(
            *,
            template:templates(*)
          ),
          service_area:service_areas(*)
        `)
        .eq('url_path', urlPath)
        .eq('status', true)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: company } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !page || !company) {
    return <NotFound />;
  }

  // Build page data for template rendering
  const pageData = {
    service_name: page.service.name,
    service_slug: page.service.slug,
    service_description: page.service.full_description || '',
    service_starting_price: formatPrice(page.service.starting_price || 0),
    service_category: page.service.category,
    city_name: page.service_area.city_name,
    city_slug: page.service_area.city_slug,
    display_name: page.service_area.display_name,
    local_description: page.service_area.local_description || '',
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
  };

  // Render template with data
  const renderedContent = renderTemplate(
    page.service.template.template_html,
    pageData
  );

  // Track view (fire and forget)
  supabase
    .from('generated_pages')
    .update({
      view_count: (page.view_count || 0) + 1,
      last_viewed_at: new Date().toISOString(),
    })
    .eq('id', page.id)
    .then(() => {});

  return (
    <PublicLayout>
      {/* SEO Meta Tags */}
      <head>
        <title>{pageData.page_title}</title>
        <meta name="description" content={pageData.meta_description} />
        <meta property="og:title" content={pageData.page_title} />
        <meta property="og:description" content={pageData.meta_description} />
        <meta property="og:url" content={`https://yoursite.com${pageData.url_path}`} />
        <meta name="twitter:title" content={pageData.page_title} />
        <meta name="twitter:description" content={pageData.meta_description} />
      </head>

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

      {/* Rendered Content */}
      <div
        className="container mx-auto px-4 py-8 prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: renderedContent }}
      />

      {/* Service Reviews Section */}
      {page.service_id && (
        <ServiceReviews 
          serviceId={page.service_id} 
          serviceName={page.service.name}
        />
      )}
    </PublicLayout>
  );
};

export default GeneratedPage;

