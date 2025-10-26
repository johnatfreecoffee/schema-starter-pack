import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCachedQuery } from '@/hooks/useCachedQuery';

import { SEOHead } from '@/components/seo/SEOHead';
import { renderTemplate } from '@/lib/templateEngine';
import AIHTMLRenderer from '@/components/ai/AIHTMLRenderer';

const StaticPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading } = useCachedQuery({
    queryKey: ['static-page', slug],
    cacheKey: `pages:static:${slug}`,
    cacheTTL: 60 * 60 * 1000, // 1 hour
    queryFn: async () => {
      const { data, error } = await supabase
        .from('static_pages')
        .select('*')
        .eq('slug', slug)
        .eq('status', true)
        .single();
      
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
        .single();
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!page) {
    return <Navigate to="/404" replace />;
  }

  // Replace Handlebars variables in content using template engine
  // Static pages use ONLY company variables (no service/area variables)
  // Reference: src/templates/STATIC_PAGES_TEMPLATE_GUIDE.md
  let renderedContent = page.content_html;
  if (companySettings) {
    try {
      const templateData = {
        company_name: companySettings.business_name || '',
        company_phone: companySettings.phone || '',
        company_email: companySettings.email || '',
        company_address: companySettings.address || '',
        company_website: companySettings.website_url || '',
        years_experience: companySettings.years_experience || 0,
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
        facebook_url: companySettings.facebook_url || '',
        instagram_url: companySettings.instagram_url || '',
        twitter_url: companySettings.twitter_url || '',
        linkedin_url: companySettings.linkedin_url || '',
        email_from_name: companySettings.email_from_name || '',
        email_signature: companySettings.email_signature || '',
        description: companySettings.description || '',
        license_numbers: companySettings.license_numbers || '',
      };
      
      renderedContent = renderTemplate(page.content_html, templateData);
    } catch (error) {
      console.error('Template rendering error:', error);
      // Fallback to original content if template rendering fails
    }
  }

  // Add lazy loading to images in rendered HTML
  renderedContent = renderedContent.replace(
    /<img(?![^>]*loading=)/gi,
    '<img loading="lazy"'
  );

  const canonicalUrl = `${window.location.origin}/${page.slug}`;

  // Check if this is a rich landing page (starts with specific container classes)
  const isRichLandingPage = renderedContent.includes('class="min-h-screen"') || 
                            renderedContent.includes('className="min-h-screen"');

  return (
    <>
      <SEOHead
        title={page.title}
        description={page.meta_description || companySettings?.description || ''}
        canonical={canonicalUrl}
        ogImage={companySettings?.logo_url}
      />
      {isRichLandingPage ? (
        <AIHTMLRenderer html={renderedContent} />
      ) : (
        // Traditional article-style pages - use prose styling
        <div className="container mx-auto px-4 py-8">
          <AIHTMLRenderer html={renderedContent} />
        </div>
      )}
    </>
  );
};

export default StaticPage;
