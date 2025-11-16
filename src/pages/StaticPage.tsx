import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCachedQuery } from '@/hooks/useCachedQuery';

import { SEOHead } from '@/components/seo/SEOHead';
import { renderTemplate, formatPhone } from '@/lib/templateEngine';
import AIHTMLRenderer from '@/components/ai/AIHTMLRenderer';
import SiteHTMLIframeRenderer from '@/components/ai/SiteHTMLIframeRenderer';

const StaticPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading } = useCachedQuery({
    queryKey: ['static-page', slug],
    cacheKey: `pages:static:${slug}`,
    cacheTTL: 60 * 60 * 1000, // 1 hour
    bypassCache: true, // Temporarily bypass cache to force fresh data
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

  // Helper function to extract body content from full HTML documents
  const extractBodyContent = (html: string): string => {
    // Check if this is a full HTML document
    if (html.includes('<!DOCTYPE') || html.match(/<html[^>]*>/i)) {
      // Extract body content
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      let bodyContent = bodyMatch ? bodyMatch[1] : html;
      
      // Extract and prepend style tags from head
      const styleMatches = html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi);
      let styles = '';
      for (const match of styleMatches) {
        styles += match[0];
      }
      
      return styles + bodyContent;
    }
    return html;
  };

  // Replace Handlebars variables in content using template engine
  // Static pages use ONLY company variables (no service/area variables)
  // Reference: src/templates/STATIC_PAGES_TEMPLATE_GUIDE.md
  let renderedContent = page.content_html;
  if (companySettings) {
    try {
      const templateData = {
        // Common company variables (both short and prefixed versions for compatibility)
        company_name: companySettings.business_name || '',
        business_name: companySettings.business_name || '',
        phone: formatPhone(companySettings.phone || ''),
        company_phone: formatPhone(companySettings.phone || ''),
        email: companySettings.email || '',
        company_email: companySettings.email || '',
        address: companySettings.address || '',
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
        email_from_name: companySettings.email_from_name || '',
        email_signature: companySettings.email_signature || '',
        description: companySettings.description || '',
        license_numbers: companySettings.license_numbers || '',
        
        // Site settings for styling
        siteSettings: {
          primary_color: siteSettings?.primary_color ?? '#3b82f6',
          secondary_color: siteSettings?.secondary_color ?? '#6b7280',
          accent_color: siteSettings?.accent_color ?? '#8b5cf6',
          success_color: siteSettings?.success_color ?? '#10b981',
          warning_color: siteSettings?.warning_color ?? '#f59e0b',
          info_color: siteSettings?.info_color ?? '#3b82f6',
          danger_color: siteSettings?.danger_color ?? '#ef4444',

          // Extended palette used by templates
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

          // Radius and icon styles
          button_border_radius: siteSettings?.button_border_radius ?? 8,
          card_border_radius: siteSettings?.card_border_radius ?? 12,
          icon_stroke_width: siteSettings?.icon_stroke_width ?? 2,
          icon_background_style: siteSettings?.icon_background_style ?? 'none',
          icon_background_padding: siteSettings?.icon_background_padding ?? 8,

          // Header & footer (used by some templates)
          header_logo_size: siteSettings?.header_logo_size ?? 48,
          header_bg_color: siteSettings?.header_bg_color ?? '#ffffff',
          header_border_color: siteSettings?.header_border_color ?? '#e5e7eb',
          footer_bg_color: siteSettings?.footer_bg_color ?? '#f8fafc',
          footer_logo_size: siteSettings?.footer_logo_size ?? 48,
          footer_text_color: siteSettings?.footer_text_color ?? '#000000',

          // Social icons
          show_social_links: siteSettings?.show_social_links ?? true,
          social_icon_style: siteSettings?.social_icon_style ?? 'colored',
          social_icon_custom_color: siteSettings?.social_icon_custom_color ?? '#000000',
          social_border_style: siteSettings?.social_border_style ?? 'none',
          social_icon_size: siteSettings?.social_icon_size ?? 24,
          use_standard_social_logos: siteSettings?.use_standard_social_logos ?? false,
        }
      };
      
      renderedContent = renderTemplate(page.content_html, templateData);
    } catch (error) {
      console.error('Template rendering error:', error);
      // Fallback to original content if template rendering fails
    }
  }

  // Decide rendering mode: use iframe when Tailwind CDN or full doc is present
  const needsIframe = /cdn\.tailwindcss\.com/i.test(page.content_html) || /<!DOCTYPE|<html/i.test(page.content_html);

  if (!needsIframe) {
    // Extract body content from full HTML documents for inline rendering
    renderedContent = extractBodyContent(renderedContent);

    // Add lazy loading to images in rendered HTML
    renderedContent = renderedContent.replace(
      /<img(?![^>]*loading=)/gi,
      '<img loading="lazy"'
    );
  }


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
      {needsIframe ? (
        <div className={isRichLandingPage ? '' : 'container mx-auto px-4 py-8'}>
          <SiteHTMLIframeRenderer html={renderedContent} />
        </div>
      ) : isRichLandingPage ? (
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
