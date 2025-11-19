import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/utils/callEdgeFunction';
import NotFound from './NotFound';
import { ServiceReviews } from '@/components/reviews/ServiceReviews';
import { Button } from '@/components/ui/button';
import { useLeadFormModal } from '@/hooks/useLeadFormModal';
import { MessageSquare } from 'lucide-react';
import AIHTMLRenderer from '@/components/ai/AIHTMLRenderer';
import SiteHTMLIframeRenderer from '@/components/ai/SiteHTMLIframeRenderer';
import { SEOHead } from '@/components/seo/SEOHead';
import { LocalBusinessSchema } from '@/components/seo/LocalBusinessSchema';

const GeneratedPage = () => {
  const { citySlug, serviceSlug } = useParams<{ citySlug: string; serviceSlug: string }>();
  const urlPath = `/services/${serviceSlug}/${citySlug}`;
  const { openModal } = useLeadFormModal();

  // Fetch server-rendered content + minimal page data via backend function
  const { data: pageResponse, isLoading, error } = useQuery({
    queryKey: ['rendered-page', urlPath],
    queryFn: async () => {
      const data = await callEdgeFunction<{ content: string; pageData: any }>({
        name: 'render-page',
        body: { urlPath },
        timeoutMs: 120000,
      });
      return data;
    },
    retry: 1,
  });

  // Fetch page record to get service_id for reviews
  const { data: pageRecord } = useQuery({
    queryKey: ['generated-page-record', urlPath],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_pages')
        .select('id, service_id')
        .eq('url_path', urlPath)
        .eq('status', true)
        .maybeSingle();
      if (error) return null as any;
      return data;
    },
    enabled: !!pageResponse,
  });

  // Company settings for SEO/schema
  const { data: company } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
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

  if (error || !pageResponse || !pageResponse.content || !pageResponse.pageData) {
    return <NotFound />;
  }

  const { content, pageData } = pageResponse;

  // Enhance content: add lazy loading to images but keep AI styling intact
  let processedContent = content.replace(
    /<img(?![^>]*loading=)/gi,
    '<img loading="lazy"'
  );

  const canonicalUrl = `${window.location.origin}${pageData.url_path}`;
  
  // Check if content needs iframe rendering (full HTML document)
  const needsIframe = processedContent && (
    processedContent.includes('<!DOCTYPE') || processedContent.includes('<html')
  );

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
        ogImage={company?.logo_url}
        twitterTitle={pageData.page_title}
        twitterDescription={pageData.meta_description}
        twitterImage={company?.logo_url}
      />

      {company && (
        <LocalBusinessSchema
          businessName={company.business_name}
          description={company.description || ''}
          address={company.address}
          phone={company.phone}
          email={company.email}
          url={window.location.origin}
          logo={company.logo_url || ''}
          serviceArea={[pageData.city_name]}
          services={[pageData.service_name]}
        />
      )}

      {/* Rendered Content */}
      <div className="m-0 p-0">
        {needsIframe ? (
          <SiteHTMLIframeRenderer html={processedContent} className="block m-0" />
        ) : (
          <AIHTMLRenderer html={processedContent} />
        )}
      </div>

      {/* Bottom CTA Section */}
      <div className="bg-muted/30 border-y mt-0">
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
                serviceId: pageRecord?.service_id,
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

      {pageRecord?.service_id && (
        <ServiceReviews 
          serviceId={pageRecord.service_id} 
          serviceName={pageData.service_name}
        />
      )}
    </>
  );
};

export default GeneratedPage;

