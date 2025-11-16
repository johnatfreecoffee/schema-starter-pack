import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { StarRating } from '@/components/reviews/StarRating';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import AIHTMLRenderer from '@/components/ai/AIHTMLRenderer';
import SiteHTMLIframeRenderer from '@/components/ai/SiteHTMLIframeRenderer';
import { SEOHead } from '@/components/seo/SEOHead';
import { renderTemplate } from '@/lib/templateEngine';

const Services = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: company } = useCompanySettings();

  // Check if a Static Page exists for the services slug
  const { data: staticServices, isLoading: staticLoading } = useCachedQuery({
    queryKey: ['static-page', 'services'],
    cacheKey: 'pages:static:services',
    cacheTTL: 60 * 60 * 1000, // 1 hour
    bypassCache: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('static_pages')
        .select('*')
        .eq('slug', 'services')
        .eq('status', true)
        .single();
      if (error) throw error;
      return data;
    }
  });

  // Fetch site settings for template variables used by static pages
  const { data: siteSettings } = useCachedQuery({
    queryKey: ['site-settings'],
    cacheKey: 'site:settings',
    cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

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

  if (staticLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (staticServices) {
    let renderedContent = staticServices.content_html as string;
    if (company) {
      try {
        const templateData = {
          company_name: company.business_name || '',
          business_name: company.business_name || '',
          phone: company.phone || '',
          company_phone: company.phone || '',
          email: company.email || '',
          company_email: company.email || '',
          address: company.address || '',
          company_address: company.address || '',
          company_website: company.website_url || '',
          years_experience: company.years_experience || 0,
          license_number: company.license_numbers || '',
          business_slogan: company.business_slogan || '',
          logo_url: company.logo_url || '',
          icon_url: company.icon_url || '',
          business_hours: company.business_hours || '',
          address_street: company.address_street || '',
          address_unit: company.address_unit || '',
          address_city: company.address_city || '',
          address_state: company.address_state || '',
          address_zip: company.address_zip || '',
          service_radius: company.service_radius || '',
          service_radius_unit: company.service_radius_unit || 'miles',
          email_from_name: company.email_from_name || '',
          email_signature: company.email_signature || '',
          description: company.description || '',
          license_numbers: company.license_numbers || '',
          siteSettings: {
            primary_color: siteSettings?.primary_color ?? '#3b82f6',
            secondary_color: siteSettings?.secondary_color ?? '#6b7280',
            accent_color: siteSettings?.accent_color ?? '#8b5cf6',
            success_color: siteSettings?.success_color ?? '#10b981',
            warning_color: siteSettings?.warning_color ?? '#f59e0b',
            info_color: siteSettings?.info_color ?? '#3b82f6',
            danger_color: siteSettings?.danger_color ?? '#ef4444',
            bg_primary_color: siteSettings?.bg_primary_color ?? '#FFFFFF',
            bg_secondary_color: siteSettings?.bg_secondary_color ?? '#F1F5F9',
            bg_tertiary_color: siteSettings?.bg_tertiary_color ?? '#E2E8F0',
            text_primary_color: siteSettings?.text_primary_color ?? '#1E293B',
            text_secondary_color: siteSettings?.text_secondary_color ?? '#475569',
            text_muted_color: siteSettings?.text_muted_color ?? '#94A3B8',
            border_color: siteSettings?.border_color ?? '#CBD5E1',
            card_bg_color: siteSettings?.card_bg_color ?? '#FFFFFF',
            feature_color: siteSettings?.feature_color ?? '#1E40AF',
            cta_color: siteSettings?.cta_color ?? '#16A34A',
            button_border_radius: siteSettings?.button_border_radius ?? 8,
            card_border_radius: siteSettings?.card_border_radius ?? 12,
            icon_stroke_width: siteSettings?.icon_stroke_width ?? 2,
            icon_background_style: siteSettings?.icon_background_style ?? 'none',
            icon_background_padding: siteSettings?.icon_background_padding ?? 8,
            header_logo_size: siteSettings?.header_logo_size ?? 48,
            header_bg_color: siteSettings?.header_bg_color ?? '#ffffff',
            header_border_color: siteSettings?.header_border_color ?? '#e5e7eb',
            footer_bg_color: siteSettings?.footer_bg_color ?? '#f8fafc',
            footer_logo_size: siteSettings?.footer_logo_size ?? 48,
            footer_text_color: siteSettings?.footer_text_color ?? '#000000',
            show_social_links: siteSettings?.show_social_links ?? true,
            social_icon_style: siteSettings?.social_icon_style ?? 'colored',
            social_icon_custom_color: siteSettings?.social_icon_custom_color ?? '#000000',
            social_border_style: siteSettings?.social_border_style ?? 'none',
            social_icon_size: siteSettings?.social_icon_size ?? 24,
            use_standard_social_logos: siteSettings?.use_standard_social_logos ?? false,
          },
        };
        renderedContent = renderTemplate(staticServices.content_html, templateData);
      } catch (e) {
        console.error('Services page template render error:', e);
      }
    }

    // Decide rendering mode: use iframe when Tailwind CDN or full doc is present
    const needsIframe = /cdn\.tailwindcss\.com/i.test(staticServices.content_html) || /<!DOCTYPE|<html/i.test(staticServices.content_html);

    if (!needsIframe) {
      // Lazy-load images
      renderedContent = renderedContent.replace(/<img(?![^>]*loading=)/gi, '<img loading="lazy"');
    }

    const canonicalUrl = `${window.location.origin}/services`;
    const isRichLandingPage = renderedContent.includes('class="min-h-screen"') || renderedContent.includes('className="min-h-screen"');

    return (
      <>
        <SEOHead
          title={staticServices.title}
          description={staticServices.meta_description || company?.description || ''}
          canonical={canonicalUrl}
          ogImage={company?.logo_url}
        />
        {needsIframe ? (
          <div className={isRichLandingPage ? '' : 'container mx-auto px-4 py-8'}>
            <SiteHTMLIframeRenderer html={renderedContent} />
          </div>
        ) : isRichLandingPage ? (
          <AIHTMLRenderer html={renderedContent} />
        ) : (
          <div className="container mx-auto px-4 py-8">
            <AIHTMLRenderer html={renderedContent} />
          </div>
        )}
      </>
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
