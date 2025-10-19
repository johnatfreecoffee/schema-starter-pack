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
      console.log('Fetching SEO settings...');
      const { data, error } = await (supabase as any)
        .from('seo_settings')
        .select('*')
        .maybeSingle();

      console.log('SEO settings loaded:', data);
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const [formData, setFormData] = useState({
    default_meta_title: '',
    default_meta_description: '',
    default_meta_keywords: '',
    default_og_image: '',
    business_name: '',
    business_phone: '',
    business_email: '',
    business_address: '',
    google_analytics_id: '',
    google_tag_manager_id: '',
    facebook_pixel_id: '',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        default_meta_title: settings.default_meta_title || '',
        default_meta_description: settings.default_meta_description || '',
        default_meta_keywords: settings.default_meta_keywords || '',
        default_og_image: settings.default_og_image || '',
        business_name: settings.business_name || '',
        business_phone: settings.business_phone || '',
        business_email: settings.business_email || '',
        business_address: settings.business_address || '',
        google_analytics_id: settings.google_analytics_id || '',
        google_tag_manager_id: settings.google_tag_manager_id || '',
        facebook_pixel_id: settings.facebook_pixel_id || '',
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Saving SEO settings:', data);
      console.log('Existing settings ID:', settings?.id);

      if (settings?.id) {
        // Update existing settings
        const { error } = await (supabase as any)
          .from('seo_settings')
          .update(data)
          .eq('id', settings.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        console.log('Settings updated successfully');
      } else {
        // Insert new settings
        const { error } = await (supabase as any)
          .from('seo_settings')
          .insert([data]);

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        console.log('Settings inserted successfully');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-settings'] });
      toast({
        title: 'Success',
        description: 'Global SEO settings have been saved',
      });
    },
    onError: (error: any) => {
      console.error('Save error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
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
            <Label htmlFor="meta-title">Default Meta Title</Label>
            <Input
              id="meta-title"
              value={formData.default_meta_title || ''}
              onChange={(e) =>
                setFormData({ ...formData, default_meta_title: e.target.value })
              }
              placeholder="Your Company Name - Professional Services"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Default title used when pages don't have custom titles
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
            <Label htmlFor="meta-keywords">Default Meta Keywords</Label>
            <Input
              id="meta-keywords"
              value={formData.default_meta_keywords || ''}
              onChange={(e) =>
                setFormData({ ...formData, default_meta_keywords: e.target.value })
              }
              placeholder="service, location, industry"
            />
          </div>

          <div>
            <Label htmlFor="og-image">Default Open Graph Image URL</Label>
            <Input
              id="og-image"
              value={formData.default_og_image || ''}
              onChange={(e) =>
                setFormData({ ...formData, default_og_image: e.target.value })
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
          <CardTitle>Business Information</CardTitle>
          <CardDescription>Used for schema.org structured data and LocalBusiness markup</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="business-name">Business Name</Label>
            <Input
              id="business-name"
              value={formData.business_name || ''}
              onChange={(e) =>
                setFormData({ ...formData, business_name: e.target.value })
              }
              placeholder="Your Company Name"
            />
          </div>

          <div>
            <Label htmlFor="business-phone">Business Phone</Label>
            <Input
              id="business-phone"
              value={formData.business_phone || ''}
              onChange={(e) =>
                setFormData({ ...formData, business_phone: e.target.value })
              }
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <Label htmlFor="business-email">Business Email</Label>
            <Input
              id="business-email"
              value={formData.business_email || ''}
              onChange={(e) =>
                setFormData({ ...formData, business_email: e.target.value })
              }
              placeholder="contact@yourcompany.com"
            />
          </div>

          <div>
            <Label htmlFor="business-address">Business Address</Label>
            <Textarea
              id="business-address"
              value={formData.business_address || ''}
              onChange={(e) =>
                setFormData({ ...formData, business_address: e.target.value })
              }
              placeholder="123 Main St, City, State 12345"
              rows={2}
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
