import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { SearchPreview } from './SearchPreview';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SEOMetaEditorProps {
  page: any;
  onClose: () => void;
}

export const SEOMetaEditor = ({ page, onClose }: SEOMetaEditorProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    meta_title: page.seo?.meta_title || page.title || '',
    meta_description: page.seo?.meta_description || '',
    meta_keywords: page.seo?.meta_keywords || '',
    og_title: page.seo?.og_title || '',
    og_description: page.seo?.og_description || '',
    og_image: page.seo?.og_image || '',
    canonical_url: page.seo?.canonical_url || page.url || '',
    robots_directives: page.seo?.robots_directives || 'index,follow',
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const seoData = {
        page_type: page.type,
        page_id: page.id,
        ...formData,
      };

      if (page.seo) {
        const { error } = await supabase
          .from('page_seo')
          .update(seoData)
          .eq('id', page.seo.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('page_seo')
          .insert([seoData]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages-seo'] });
      toast({
        title: 'SEO settings saved',
        description: 'Page meta tags have been updated',
      });
      onClose();
    },
  });

  const titleLength = formData.meta_title.length;
  const descriptionLength = formData.meta_description.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Pages
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{page.title}</h2>
          <p className="text-sm text-muted-foreground">{page.url}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Meta Tags</CardTitle>
              <CardDescription>
                Configure meta tags for search engines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="meta-title">Meta Title</Label>
                <Input
                  id="meta-title"
                  value={formData.meta_title}
                  onChange={(e) =>
                    setFormData({ ...formData, meta_title: e.target.value })
                  }
                  placeholder="Page title for search results"
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-muted-foreground">
                    {titleLength} / 60 characters
                  </p>
                  {titleLength > 60 && (
                    <p className="text-xs text-orange-600">
                      Too long - may be truncated
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="meta-description">Meta Description</Label>
                <Textarea
                  id="meta-description"
                  value={formData.meta_description}
                  onChange={(e) =>
                    setFormData({ ...formData, meta_description: e.target.value })
                  }
                  placeholder="Brief description for search results"
                  rows={3}
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-muted-foreground">
                    {descriptionLength} / 160 characters
                  </p>
                  {descriptionLength > 160 && (
                    <p className="text-xs text-orange-600">
                      Too long - may be truncated
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="meta-keywords">Meta Keywords (comma-separated)</Label>
                <Input
                  id="meta-keywords"
                  value={formData.meta_keywords}
                  onChange={(e) =>
                    setFormData({ ...formData, meta_keywords: e.target.value })
                  }
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>

              <div>
                <Label htmlFor="canonical">Canonical URL</Label>
                <Input
                  id="canonical"
                  value={formData.canonical_url}
                  onChange={(e) =>
                    setFormData({ ...formData, canonical_url: e.target.value })
                  }
                  placeholder="https://example.com/page"
                />
              </div>

              <div>
                <Label htmlFor="robots">Robots Directives</Label>
                <Input
                  id="robots"
                  value={formData.robots_directives}
                  onChange={(e) =>
                    setFormData({ ...formData, robots_directives: e.target.value })
                  }
                  placeholder="index,follow"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Open Graph (Social Media)</CardTitle>
              <CardDescription>
                Configure how this page appears when shared on social media
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="og-title">OG Title</Label>
                <Input
                  id="og-title"
                  value={formData.og_title}
                  onChange={(e) =>
                    setFormData({ ...formData, og_title: e.target.value })
                  }
                  placeholder="Title for social media"
                />
              </div>

              <div>
                <Label htmlFor="og-description">OG Description</Label>
                <Textarea
                  id="og-description"
                  value={formData.og_description}
                  onChange={(e) =>
                    setFormData({ ...formData, og_description: e.target.value })
                  }
                  placeholder="Description for social media"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="og-image">OG Image URL</Label>
                <Input
                  id="og-image"
                  value={formData.og_image}
                  onChange={(e) =>
                    setFormData({ ...formData, og_image: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: 1200x630px
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Preview</CardTitle>
              <CardDescription>
                How this page will appear in Google search results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SearchPreview
                title={formData.meta_title}
                description={formData.meta_description}
                url={page.url}
              />
            </CardContent>
          </Card>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>SEO Tips:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Keep titles between 50-60 characters</li>
                <li>Keep descriptions between 150-160 characters</li>
                <li>Include relevant keywords naturally</li>
                <li>Make each page's title and description unique</li>
                <li>Ensure canonical URLs are absolute</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? 'Saving...' : 'Save SEO Settings'}
        </Button>
      </div>
    </div>
  );
};
