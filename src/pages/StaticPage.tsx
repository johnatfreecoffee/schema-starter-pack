import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { sanitizeHtml } from '@/lib/sanitize';

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

  // Replace Handlebars variables in content
  let renderedContent = page.content_html;
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
    <div className="container mx-auto px-4 py-8">
      <article 
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(renderedContent) }}
      />
    </div>
  );
};

export default StaticPage;
