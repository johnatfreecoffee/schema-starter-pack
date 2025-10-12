import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const LinkChecker = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [scanning, setScanning] = useState(false);

  const { data: pages, isLoading } = useQuery({
    queryKey: ['generated-pages-check'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_pages')
        .select('id, url_path, page_title, rendered_html, service_id, service_area_id, status');
      
      if (error) throw error;

      const issues = data?.map(page => {
        const pageIssues: string[] = [];
        
        if (!page.rendered_html || page.rendered_html.includes('{{')) {
          pageIssues.push('Contains unreplaced template variables');
        }
        
        if (!page.status) {
          pageIssues.push('Page is inactive');
        }
        
        if (!page.url_path || page.url_path.includes(' ')) {
          pageIssues.push('Invalid URL format');
        }

        return {
          ...page,
          issues: pageIssues,
          hasIssues: pageIssues.length > 0
        };
      });

      return issues;
    }
  });

  const regenerateAllMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('generated_pages')
        .update({ needs_regeneration: true })
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-pages-check'] });
      toast({
        title: 'Success',
        description: 'All pages marked for regeneration'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const scanLinks = async () => {
    setScanning(true);
    await queryClient.invalidateQueries({ queryKey: ['generated-pages-check'] });
    setScanning(false);
  };

  const totalPages = pages?.length || 0;
  const pagesWithIssues = pages?.filter(p => p.hasIssues).length || 0;
  const healthyPages = totalPages - pagesWithIssues;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Link & Page Checker</CardTitle>
        <CardDescription>Verify all generated pages and internal links</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <p className="text-2xl font-bold">{totalPages}</p>
            <p className="text-sm text-muted-foreground">Total Pages</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-2xl font-bold text-green-600">{healthyPages}</p>
            <p className="text-sm text-muted-foreground">Healthy</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-2xl font-bold text-red-600">{pagesWithIssues}</p>
            <p className="text-sm text-muted-foreground">Issues Found</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={scanLinks} disabled={scanning || isLoading}>
            {scanning ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Scan Pages
          </Button>
          <Button 
            variant="outline" 
            onClick={() => regenerateAllMutation.mutate()}
            disabled={regenerateAllMutation.isPending}
          >
            Regenerate All Pages
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {pages?.filter(p => p.hasIssues).map(page => (
              <div key={page.id} className="p-3 border rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{page.page_title}</p>
                    <p className="text-sm text-muted-foreground">{page.url_path}</p>
                    <ul className="mt-2 space-y-1">
                      {page.issues.map((issue, idx) => (
                        <li key={idx} className="text-sm text-red-600">• {issue}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
            {pagesWithIssues === 0 && (
              <div className="flex items-center justify-center py-8 text-green-600">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                All pages are healthy
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};