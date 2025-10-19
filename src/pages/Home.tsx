import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Index from './Index';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { useEffect } from 'react';
import { sanitizeHtml } from '@/lib/sanitize';
import { SEOHead } from '@/components/seo/SEOHead';
import { LocalBusinessSchema } from '@/components/seo/LocalBusinessSchema';

const Home = () => {
  const startTime = performance.now();

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

  // Track page load performance
  useEffect(() => {
    if (!isLoading && (homepage || companySettings)) {
      const loadTime = performance.now() - startTime;
      console.log(`Home page loaded in ${loadTime.toFixed(2)}ms`);
    }
  }, [isLoading, homepage, companySettings, startTime]);

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
      renderedContent = renderedContent
        .replace(/\{\{company_name\}\}/g, companySettings.business_name || '')
        .replace(/\{\{company_phone\}\}/g, companySettings.phone || '')
        .replace(/\{\{company_email\}\}/g, companySettings.email || '')
        .replace(/\{\{company_address\}\}/g, companySettings.address || '')
        .replace(/\{\{company_description\}\}/g, companySettings.description || '')
        .replace(/\{\{logo_url\}\}/g, companySettings.logo_url || '')
        .replace(/\{\{icon_url\}\}/g, companySettings.icon_url || '');
    }

    // Add lazy loading to images in rendered HTML
    renderedContent = renderedContent.replace(
      /<img(?![^>]*loading=)/gi,
      '<img loading="lazy"'
    );

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
          phone={companySettings?.phone}
          email={companySettings?.email}
          url={window.location.origin}
          logo={companySettings?.logo_url}
        />
        <div className="container mx-auto px-4 py-8">
          <article 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(renderedContent) }}
          />
        </div>
      </>
    );
  }

  // Fallback to default homepage
  return <Index />;
};

export default Home;
