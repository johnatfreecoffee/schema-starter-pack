import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

export const GlobalSEOSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
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

  const [formData, setFormData] = useState({
    default_title_suffix: '',
    default_meta_description: '',
    og_default_image: '',
    twitter_handle: '',
    google_analytics_id: '',
    google_tag_manager_id: '',
    facebook_pixel_id: '',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        default_title_suffix: settings.default_title_suffix || '',
        default_meta_description: settings.default_meta_description || '',
        og_default_image: settings.og_default_image || '',
        twitter_handle: settings.twitter_handle || '',
        google_analytics_id: settings.google_analytics_id || '',
        google_tag_manager_id: settings.google_tag_manager_id || '',
        facebook_pixel_id: settings.facebook_pixel_id || '',
      });
    }
  }, [settings]);

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
        description: 'Global SEO settings have been updated',
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Default Meta Tags</CardTitle>
          <CardDescription>
            These values are used as fallbacks when pages don't have custom meta tags
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title-suffix">Default Title Suffix</Label>
            <Input
              id="title-suffix"
              value={formData.default_title_suffix || ''}
              onChange={(e) =>
                setFormData({ ...formData, default_title_suffix: e.target.value })
              }
              placeholder="| Your Company Name"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Appears after page titles (e.g., "Home | Your Company Name")
            </p>
          </div>

          <div>
            <Label htmlFor="meta-description">Default Meta Description</Label>
            <Textarea
              id="meta-description"
              value={formData.default_meta_description || ''}
              onChange={(e) =>
                setFormData({ ...formData, default_meta_description: e.target.value })
              }
              placeholder="A brief description of your business..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.default_meta_description?.length || 0} / 160 characters
            </p>
          </div>

          <div>
            <Label htmlFor="og-image">Default Open Graph Image URL</Label>
            <Input
              id="og-image"
              value={formData.og_default_image || ''}
              onChange={(e) =>
                setFormData({ ...formData, og_default_image: e.target.value })
              }
              placeholder="https://example.com/og-image.jpg"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Used for social media previews (recommended: 1200x630px)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Media</CardTitle>
          <CardDescription>Configure social media integration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="twitter-handle">Twitter Handle</Label>
            <Input
              id="twitter-handle"
              value={formData.twitter_handle || ''}
              onChange={(e) =>
                setFormData({ ...formData, twitter_handle: e.target.value })
              }
              placeholder="@yourcompany"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analytics & Tracking</CardTitle>
          <CardDescription>
            Add tracking codes for analytics and marketing tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="ga-id">Google Analytics ID</Label>
            <Input
              id="ga-id"
              value={formData.google_analytics_id || ''}
              onChange={(e) =>
                setFormData({ ...formData, google_analytics_id: e.target.value })
              }
              placeholder="G-XXXXXXXXXX"
            />
          </div>

          <div>
            <Label htmlFor="gtm-id">Google Tag Manager ID</Label>
            <Input
              id="gtm-id"
              value={formData.google_tag_manager_id || ''}
              onChange={(e) =>
                setFormData({ ...formData, google_tag_manager_id: e.target.value })
              }
              placeholder="GTM-XXXXXXX"
            />
          </div>

          <div>
            <Label htmlFor="fb-pixel">Facebook Pixel ID</Label>
            <Input
              id="fb-pixel"
              value={formData.facebook_pixel_id || ''}
              onChange={(e) =>
                setFormData({ ...formData, facebook_pixel_id: e.target.value })
              }
              placeholder="XXXXXXXXXXXXXXXX"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};
