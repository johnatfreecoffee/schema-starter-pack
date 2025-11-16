import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { Phone, Mail, MapPin } from 'lucide-react';
import { LeadFormEmbed } from '@/components/lead-form/LeadFormEmbed';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { supabase } from '@/integrations/supabase/client';
import AIHTMLRenderer from '@/components/ai/AIHTMLRenderer';
import SiteHTMLIframeRenderer from '@/components/ai/SiteHTMLIframeRenderer';
import { SEOHead } from '@/components/seo/SEOHead';
import { renderTemplate } from '@/lib/templateEngine';

const Contact = () => {
  const { data: company } = useCompanySettings();

  // If a Static Page exists for the contact slug, render it instead of the legacy page
  const { data: staticContact, isLoading } = useCachedQuery({
    queryKey: ['static-page', 'contact'],
    cacheKey: 'pages:static:contact',
    cacheTTL: 60 * 60 * 1000, // 1 hour
    bypassCache: true, // ensure freshly published content is shown immediately
    queryFn: async () => {
      const { data, error } = await supabase
        .from('static_pages')
        .select('*')
        .eq('slug', 'contact')
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

  if (staticContact) {
    let renderedContent = staticContact.content_html as string;
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
        renderedContent = renderTemplate(staticContact.content_html, templateData);
      } catch (e) {
        console.error('Contact page template render error:', e);
      }
    }

    // Decide rendering mode: use iframe when Tailwind CDN or full doc is present
    const needsIframe = /cdn\.tailwindcss\.com/i.test(staticContact.content_html) || /<!DOCTYPE|<html/i.test(staticContact.content_html);

    if (!needsIframe) {
      // Lazy-load images
      renderedContent = renderedContent.replace(/<img(?![^>]*loading=)/gi, '<img loading="lazy"');
    }

    const canonicalUrl = `${window.location.origin}/contact`;
    const isRichLandingPage = renderedContent.includes('class="min-h-screen"') || renderedContent.includes('className="min-h-screen"');

    return (
      <>
        <SEOHead
          title={staticContact.title}
          description={staticContact.meta_description || company?.description || ''}
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

  // Fallback: legacy contact page
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Contact Us</h1>
      <div className="max-w-2xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Get In Touch</CardTitle>
            <CardDescription>We'd love to hear from you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {company?.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-muted-foreground">{company.phone}</p>
                </div>
              </div>
            )}
            {company?.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-muted-foreground">{company.email}</p>
                </div>
              </div>
            )}
            {company?.address && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-muted-foreground">{company.address}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <LeadFormEmbed 
          headerText="Send Us a Message"
          showHeader={true}
        />
      </div>
    </div>
  );
};

export default Contact;
