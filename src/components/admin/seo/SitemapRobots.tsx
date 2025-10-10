import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save, RefreshCw, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const SitemapRobots = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['seo-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seo_settings')
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
  });

  const [robotsTxt, setRobotsTxt] = useState(settings?.robots_txt || '');

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('seo_settings')
        .update(data)
        .eq('id', settings?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-settings'] });
      toast({
        title: 'Settings saved',
        description: 'Sitemap and robots.txt have been updated',
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ robots_txt: robotsTxt });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>robots.txt Editor</CardTitle>
          <CardDescription>
            Configure which pages search engines can crawl
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="robots">robots.txt Content</Label>
            <Textarea
              id="robots"
              value={robotsTxt}
              onChange={(e) => setRobotsTxt(e.target.value)}
              rows={10}
              className="font-mono text-sm"
              placeholder="User-agent: *&#10;Allow: /&#10;Sitemap: /sitemap.xml"
            />
          </div>

          <Alert>
            <AlertDescription>
              <strong>Default robots.txt:</strong>
              <pre className="mt-2 p-2 bg-muted rounded text-sm">
                User-agent: *{'\n'}
                Allow: /{'\n'}
                Sitemap: /sitemap.xml
              </pre>
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Save robots.txt
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('/robots.txt', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Current robots.txt
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sitemap Configuration</CardTitle>
          <CardDescription>
            Your sitemap is automatically generated from your pages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <strong>Available Sitemaps:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>/sitemap.xml - Main sitemap index</li>
                <li>/sitemap-static.xml - Static pages</li>
                <li>/sitemap-services.xml - Service pages</li>
                <li>/sitemap-areas.xml - Area pages</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.open('/sitemap.xml', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Sitemap
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                toast({
                  title: 'Sitemap regenerated',
                  description: 'Sitemap has been updated with latest pages',
                });
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate Sitemap
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
