import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { supabase } from '@/integrations/supabase/client';
import AIHTMLRenderer from '@/components/ai/AIHTMLRenderer';
import { SEOHead } from '@/components/seo/SEOHead';
import { renderTemplate } from '@/lib/templateEngine';

const AboutUs = () => {
  const { data: company } = useCompanySettings();

  // Check if a Static Page exists for the about-us slug
  const { data: staticAbout, isLoading } = useCachedQuery({
    queryKey: ['static-page', 'about-us'],
    cacheKey: 'pages:static:about-us',
    cacheTTL: 60 * 60 * 1000, // 1 hour
    bypassCache: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('static_pages')
        .select('*')
        .eq('slug', 'about-us')
        .eq('status', true)
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

  if (staticAbout) {
    let renderedContent = staticAbout.content_html as string;
    if (company) {
      try {
        const templateData = {
          company_name: company.business_name || '',
          company_phone: company.phone || '',
          company_email: company.email || '',
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
        };
        renderedContent = renderTemplate(staticAbout.content_html, templateData);
      } catch (e) {
        console.error('About page template render error:', e);
      }
    }

    renderedContent = renderedContent.replace(/<img(?![^>]*loading=)/gi, '<img loading="lazy"');

    const canonicalUrl = `${window.location.origin}/about-us`;
    const isRichLandingPage = renderedContent.includes('class="min-h-screen"') || renderedContent.includes('className="min-h-screen"');

    return (
      <>
        <SEOHead
          title={staticAbout.title}
          description={staticAbout.meta_description || company?.description || ''}
          canonical={canonicalUrl}
          ogImage={company?.logo_url}
        />
        {isRichLandingPage ? (
          <AIHTMLRenderer html={renderedContent} />
        ) : (
          <div className="container mx-auto px-4 py-8">
            <AIHTMLRenderer html={renderedContent} />
          </div>
        )}
      </>
    );
  }

  // Fallback: legacy about page
  return (
    <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">About Us</h1>
        <div className="max-w-3xl mx-auto space-y-6">
          <p className="text-lg">
            {company?.description || 'Learn more about our company and mission.'}
          </p>
          {company?.years_experience && (
            <div className="bg-primary/10 p-6 rounded-lg">
              <p className="text-2xl font-bold text-primary">
                {company.years_experience}+ Years of Experience
              </p>
            </div>
          )}
        </div>
      </div>
  );
};

export default AboutUs;
