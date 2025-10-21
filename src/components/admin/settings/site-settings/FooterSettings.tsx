import { useEffect, useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cacheInvalidation } from '@/lib/cacheInvalidation';
import ColorPicker from './ColorPicker';
import { SocialMediaManager } from './SocialMediaManager';

const FooterSettings = () => {
  const queryClient = useQueryClient();
  const [logoSize, setLogoSize] = useState(32);
  const [bgColor, setBgColor] = useState('#1f2937');
  const [textColor, setTextColor] = useState('#ffffff');
  const [showSocial, setShowSocial] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from('site_settings')
          .insert({})
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newSettings;
      }
      
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      setLogoSize(settings.footer_logo_size);
      setBgColor(settings.footer_bg_color);
      setTextColor(settings.footer_text_color);
      setShowSocial(settings.show_social_links);
      
      // Apply to CSS variables
      document.documentElement.style.setProperty('--footer-bg', settings.footer_bg_color);
      document.documentElement.style.setProperty('--footer-logo-size', `${settings.footer_logo_size}px`);
      document.documentElement.style.setProperty('--footer-text', settings.footer_text_color);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { data, error } = await supabase
        .from('site_settings')
        .update({
          ...updates,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', settings?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      await cacheInvalidation.invalidateSiteSettings();
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      
      // Apply to CSS variables
      document.documentElement.style.setProperty('--footer-bg', data.footer_bg_color);
      document.documentElement.style.setProperty('--footer-logo-size', `${data.footer_logo_size}px`);
      document.documentElement.style.setProperty('--footer-text', data.footer_text_color);
      
      setIsSaving(false);
    },
    onError: () => {
      toast.error('Failed to save footer settings');
      setIsSaving(false);
    },
  });

  const autoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(() => {
      updateMutation.mutate({
        footer_logo_size: logoSize,
        footer_bg_color: bgColor,
        footer_text_color: textColor,
        show_social_links: showSocial,
      });
    }, 1000);
  }, [logoSize, bgColor, textColor, showSocial, updateMutation]);

  useEffect(() => {
    if (settings && settings.id) {
      autoSave();
    }
  }, [logoSize, bgColor, textColor, showSocial]);

  return (
    <div className="space-y-6">
      {isSaving && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Saving...
        </div>
      )}
      
      <div>
        <Label htmlFor="footer-bg">Footer Background Color</Label>
        <ColorPicker
          value={bgColor}
          onChange={setBgColor}
          label="Footer Background"
        />
      </div>

      <div>
        <Label htmlFor="footer-logo-size">Footer Logo Size: {logoSize}px</Label>
        <Slider
          id="footer-logo-size"
          min={16}
          max={48}
          step={1}
          value={[logoSize]}
          onValueChange={([value]) => setLogoSize(value)}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="footer-text">Footer Text Color</Label>
        <ColorPicker
          value={textColor}
          onChange={setTextColor}
          label="Footer Text"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="show-social"
          checked={showSocial}
          onCheckedChange={setShowSocial}
        />
        <Label htmlFor="show-social">Show Social Media Links</Label>
      </div>

      {showSocial && (
        <div className="space-y-6 p-4 border rounded-lg">
          <h3 className="font-semibold text-lg">Social Media Management</h3>
          
          <SocialMediaManager />
        </div>
      )}
    </div>
  );
};

export default FooterSettings;
