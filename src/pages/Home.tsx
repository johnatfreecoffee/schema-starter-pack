import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Index from './Index';
import { useCachedQuery } from '@/hooks/useCachedQuery';

import { SEOHead } from '@/components/seo/SEOHead';
import { LocalBusinessSchema } from '@/components/seo/LocalBusinessSchema';
import { renderTemplate, formatPhone } from '@/lib/templateEngine';
import AIHTMLRenderer from '@/components/ai/AIHTMLRenderer';
import SiteHTMLIframeRenderer from '@/components/ai/SiteHTMLIframeRenderer';

const Home = () => {
  const { data: homepage, isLoading } = useCachedQuery({
    queryKey: ['homepage'],
    cacheKey: 'pages:homepage',
    cacheTTL: 60 * 60 * 1000, // 1 hour
    queryFn: async () => {
      const { data, error } = await supabase
        .from('static_pages')
        .select('*')
        .eq('is_homepage', true)
        .eq('status', true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: companySettings } = useCachedQuery({
    queryKey: ['company-settings'],
    cacheKey: 'company:settings',
    cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

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

  // Service areas for templates like "Serving 18 Communities"
  const { data: serviceAreasData } = useCachedQuery({
    queryKey: ['service-areas'],
    cacheKey: 'site:service-areas',
    cacheTTL: 6 * 60 * 60 * 1000, // 6 hours
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_areas')
        .select('id, area_name, display_name, city_name, state, zip_code, archived, status')
        .eq('archived', false)
        .eq('status', true)
        .order('area_name', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // If a homepage static page exists, render it
  if (homepage) {
    let renderedContent = homepage.content_html;
    if (companySettings) {
      try {
      const templateData = {
        // Common company variables
        company_name: companySettings.business_name || '',
        business_name: companySettings.business_name || '',
        phone: formatPhone(companySettings.phone || ''),
        company_phone: formatPhone(companySettings.phone || ''),
        email: companySettings.email || '',
        company_email: companySettings.email || '',
        address: companySettings.address || '',
        company_address: companySettings.address || '',
        company_website: companySettings.website_url || '',
        company_years_in_business: companySettings.years_experience || 0,
        years_experience: companySettings.years_experience || 0,
        company_city: companySettings.address_city || '',
        company_state: companySettings.address_state || '',
        company_zip: companySettings.address_zip || '',
        license_number: companySettings.license_numbers || '',
        business_slogan: companySettings.business_slogan || '',
        logo_url: companySettings.logo_url || '',
        icon_url: companySettings.icon_url || '',
        business_hours: companySettings.business_hours || '',
        address_street: companySettings.address_street || '',
        address_unit: companySettings.address_unit || '',
        address_city: companySettings.address_city || '',
        address_state: companySettings.address_state || '',
        address_zip: companySettings.address_zip || '',
        service_radius: companySettings.service_radius || '',
        service_radius_unit: companySettings.service_radius_unit || 'miles',
        email_from_name: companySettings.email_from_name || '',
        email_signature: companySettings.email_signature || '',
        description: companySettings.description || '',
        license_numbers: companySettings.license_numbers || '',
        
        // Site settings for styling
        siteSettings: {
          primary_color: siteSettings?.primary_color ?? 'hsl(221, 83%, 53%)',
          secondary_color: siteSettings?.secondary_color ?? 'hsl(210, 40%, 96%)',
          accent_color: siteSettings?.accent_color ?? 'hsl(280, 65%, 60%)',
          success_color: siteSettings?.success_color ?? '#10b981',
          warning_color: siteSettings?.warning_color ?? '#f59e0b',
          info_color: siteSettings?.info_color ?? '#3b82f6',
          danger_color: siteSettings?.danger_color ?? '#ef4444',
          bg_primary_color: siteSettings?.bg_primary_color ?? 'hsl(0, 0%, 100%)',
          bg_secondary_color: siteSettings?.bg_secondary_color ?? 'hsl(0, 0%, 96%)',
          bg_tertiary_color: siteSettings?.bg_tertiary_color ?? 'hsl(0, 0%, 89%)',
          text_primary_color: siteSettings?.text_primary_color ?? 'hsl(0, 0%, 13%)',
          text_secondary_color: siteSettings?.text_secondary_color ?? 'hsl(0, 0%, 45%)',
          text_muted_color: siteSettings?.text_muted_color ?? 'hsl(0, 0%, 64%)',
          border_color: siteSettings?.border_color ?? 'hsl(0, 0%, 89%)',
          card_bg_color: siteSettings?.card_bg_color ?? 'hsl(0, 0%, 100%)',
          feature_color: siteSettings?.feature_color ?? 'hsl(221, 83%, 53%)',
          cta_color: siteSettings?.cta_color ?? 'hsl(142, 71%, 45%)',
          button_border_radius: siteSettings?.button_border_radius ?? 8,
          card_border_radius: siteSettings?.card_border_radius ?? 12,
          icon_stroke_width: siteSettings?.icon_stroke_width ?? 2,
        },

        // Data-driven lists used by templates
        serviceAreas: (serviceAreasData || []).map((sa: any) => ({
          area_name: sa.area_name || sa.display_name || sa.city_name || '',
          city: sa.city_name || '',
          state: sa.state || 'LA',
          zip_code: sa.zip_code || '',
          county: sa.county || ''
        })),
      };
        renderedContent = renderTemplate(homepage.content_html, templateData);
      } catch (error) {
        console.error('Template rendering error (homepage):', error);
        // Fallback to original content if template rendering fails
      }
    }

    // Decide rendering mode: use iframe when Tailwind CDN or full doc is present
    const needsIframe = /cdn\.tailwindcss\.com/i.test(homepage.content_html) || /<!DOCTYPE|<html/i.test(homepage.content_html);

    if (!needsIframe) {
      // Lazy-load images
      renderedContent = renderedContent.replace(/<img(?![^>]*loading=)/gi, '<img loading="lazy"');
    }

    // Check if this is a rich landing page (starts with specific container classes)
    const isRichLandingPage = renderedContent.includes('class="min-h-screen"') || 
                              renderedContent.includes('className="min-h-screen"');

    return (
      <>
        <SEOHead
          title={homepage.title || `${companySettings?.business_name || 'Home'}`}
          description={homepage.meta_description || companySettings?.description || ''}
          canonical={window.location.origin}
          ogImage={companySettings?.logo_url}
        />
        <LocalBusinessSchema
          businessName={companySettings?.business_name || ''}
          description={companySettings?.description}
          address={companySettings?.address}
          city={companySettings?.address_city}
          state={companySettings?.address_state}
          zip={companySettings?.address_zip}
          phone={companySettings?.phone}
          email={companySettings?.email}
          url={window.location.origin}
          logo={companySettings?.logo_url}
          serviceArea={serviceAreasData?.map(area => area.city_name || area.area_name).filter(Boolean)}
        />
        {needsIframe ? (
          <SiteHTMLIframeRenderer html={renderedContent} />
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

  // Fallback to default homepage
  return <Index />;
};

export default Home;
