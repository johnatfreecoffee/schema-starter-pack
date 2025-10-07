import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PublicLayout from '@/components/layout/PublicLayout';
import Index from './Index';

const Home = () => {
  const { data: homepage, isLoading } = useQuery({
    queryKey: ['homepage'],
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

  const { data: companySettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </PublicLayout>
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

    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-8">
          <article 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: renderedContent }}
          />
        </div>
      </PublicLayout>
    );
  }

  // Fallback to default homepage
  return <Index />;
};

export default Home;
