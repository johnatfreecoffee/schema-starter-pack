import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UnifiedPageEditor from '@/components/admin/ai-editor/UnifiedPageEditor';
import { PageLoadingSkeleton } from '@/components/ui/page-loading-skeleton';

export const AIEditorStaticPage = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();

  const { data: page, isLoading } = useQuery({
    queryKey: ['static-page', pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('static_pages')
        .select('*')
        .eq('id', pageId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!pageId,
  });

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Page not found</h2>
          <Button onClick={() => navigate('/dashboard/settings/static-pages')}>
            Back to Static Pages
          </Button>
        </div>
      </div>
    );
  }

  return (
    <UnifiedPageEditor
      open={true}
      onClose={() => navigate('/dashboard/settings/static-pages')}
      pageId={page.id}
      pageType="static"
      pageTitle={page.title}
      onSave={async () => {}}
      fullScreen={true}
    />
  );
};

export const AIEditorServicePage = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();

  const { data: service, isLoading } = useQuery({
    queryKey: ['service-for-editor', serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*, templates(*)')
        .eq('id', serviceId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!serviceId,
  });

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Service not found</h2>
          <Button onClick={() => navigate('/dashboard/settings/services')}>
            Back to Services
          </Button>
        </div>
      </div>
    );
  }

  return (
    <UnifiedPageEditor
      open={true}
      onClose={() => navigate('/dashboard/settings/services')}
      service={service}
      pageType="service"
      pageTitle={service.name}
      pageId={service.template_id}
      onSave={async () => {}}
      fullScreen={true}
    />
  );
};
