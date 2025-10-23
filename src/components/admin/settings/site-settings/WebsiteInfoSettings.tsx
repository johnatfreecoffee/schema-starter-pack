import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save, Upload, Globe } from 'lucide-react';

export const WebsiteInfoSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: companySettings, isLoading } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const [formData, setFormData] = useState({
    icon_url: '',
    business_name: '',
    business_slogan: '',
    description: '',
    logo_url: '',
  });

  useEffect(() => {
    if (companySettings) {
      setFormData({
        icon_url: companySettings.icon_url || '',
        business_name: companySettings.business_name || '',
        business_slogan: companySettings.business_slogan || '',
        description: companySettings.description || '',
        logo_url: companySettings.logo_url || '',
      });
    }
  }, [companySettings]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!companySettings?.id) {
        throw new Error('Company settings not found');
      }

      const { error } = await supabase
        .from('company_settings')
        .update(data)
        .eq('id', companySettings.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      toast({
        title: 'Success',
        description: 'Website info has been updated',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update settings',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleFileUpload = async (file: File, type: 'icon' | 'logo') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath);

      if (type === 'icon') {
        setFormData({ ...formData, icon_url: publicUrl });
      } else {
        setFormData({ ...formData, logo_url: publicUrl });
      }

      toast({
        title: 'Success',
        description: `${type === 'icon' ? 'Icon' : 'Share image'} uploaded successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload file',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Icon & Title
          </CardTitle>
          <CardDescription>
            These settings control how your site appears in browser tabs and bookmarks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="icon-url">Favicon/Icon URL</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="icon-url"
                value={formData.icon_url}
                onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                placeholder="https://example.com/favicon.ico"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*,.ico';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleFileUpload(file, 'icon');
                  };
                  input.click();
                }}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            {formData.icon_url && (
              <div className="mt-2">
                <img src={formData.icon_url} alt="Icon preview" className="h-8 w-8 object-contain" />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Recommended: 32x32px or 64x64px .ico or .png file
            </p>
          </div>

          <div>
            <Label htmlFor="business-name">Site Title</Label>
            <Input
              id="business-name"
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              placeholder="Your Business Name"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Appears in browser tabs and page titles
            </p>
          </div>

          <div>
            <Label htmlFor="business-slogan">Tagline/Slogan (Optional)</Label>
            <Input
              id="business-slogan"
              value={formData.business_slogan || ''}
              onChange={(e) => setFormData({ ...formData, business_slogan: e.target.value })}
              placeholder="Your memorable tagline"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
          <CardDescription>
            Default description used for search engine results and social media previews
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="description">Site Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="A brief description of your business and what you offer..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {(formData.description || '').length} / 160 characters recommended
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Share Image</CardTitle>
          <CardDescription>
            Default image shown when your site is shared on social media (Open Graph)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="logo-url">Share Image URL</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="logo-url"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="https://example.com/og-image.jpg"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleFileUpload(file, 'logo');
                  };
                  input.click();
                }}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            {formData.logo_url && (
              <div className="mt-2 border rounded-md p-2">
                <img 
                  src={formData.logo_url} 
                  alt="Share image preview" 
                  className="max-h-32 object-contain"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Recommended: 1200x630px for optimal social media display
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? 'Saving...' : 'Save Website Info'}
        </Button>
      </div>
    </div>
  );
};
