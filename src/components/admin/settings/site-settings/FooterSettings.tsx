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
import { SocialMediaPreview } from './SocialMediaPreview';

const FooterSettings = () => {
  const queryClient = useQueryClient();
  const [logoSize, setLogoSize] = useState(32);
  const [bgColor, setBgColor] = useState('#1f2937');
  const [textColor, setTextColor] = useState('#ffffff');
  const [showSocial, setShowSocial] = useState(false);
  const [useStandardLogos, setUseStandardLogos] = useState(true);
  const [iconStyle, setIconStyle] = useState('colored');
  const [customColor, setCustomColor] = useState('#000000');
  const [borderStyle, setBorderStyle] = useState('circle');
  const [iconSize, setIconSize] = useState(24);
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
      setUseStandardLogos((settings as any).use_standard_social_logos ?? true);
      setIconStyle((settings as any).social_icon_style || 'colored');
      setCustomColor((settings as any).social_icon_custom_color || '#000000');
      setBorderStyle((settings as any).social_border_style || 'circle');
      setIconSize((settings as any).social_icon_size || 24);
      
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
        use_standard_social_logos: useStandardLogos,
        social_icon_style: iconStyle,
        social_icon_custom_color: customColor,
        social_border_style: borderStyle,
        social_icon_size: iconSize,
      });
    }, 1000);
  }, [logoSize, bgColor, textColor, showSocial, useStandardLogos, iconStyle, customColor, borderStyle, iconSize, updateMutation]);

  useEffect(() => {
    if (settings && settings.id) {
      autoSave();
    }
  }, [logoSize, bgColor, textColor, showSocial, useStandardLogos, iconStyle, customColor, borderStyle, iconSize]);

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

          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold">Icon Appearance</h4>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="use-standard-logos"
                checked={useStandardLogos}
                onCheckedChange={setUseStandardLogos}
              />
              <Label htmlFor="use-standard-logos">Use Standard Platform Logos</Label>
            </div>

            {!useStandardLogos && (
              <>
                <div>
                  <Label>Icon Style</Label>
                  <div className="space-y-2 mt-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="colored"
                        checked={iconStyle === 'colored'}
                        onChange={(e) => setIconStyle(e.target.value)}
                      />
                      <span>Colored icons (platform brand colors)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="black"
                        checked={iconStyle === 'black'}
                        onChange={(e) => setIconStyle(e.target.value)}
                      />
                      <span>Black icons</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="white"
                        checked={iconStyle === 'white'}
                        onChange={(e) => setIconStyle(e.target.value)}
                      />
                      <span>White icons</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="custom"
                        checked={iconStyle === 'custom'}
                        onChange={(e) => setIconStyle(e.target.value)}
                      />
                      <span>Custom color</span>
                    </label>
                    {iconStyle === 'custom' && (
                      <div className="ml-6">
                        <ColorPicker
                          value={customColor}
                          onChange={setCustomColor}
                          label="Custom Icon Color"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Border Style</Label>
                  <div className="space-y-2 mt-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="none"
                        checked={borderStyle === 'none'}
                        onChange={(e) => setBorderStyle(e.target.value)}
                      />
                      <span>No border</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="circle"
                        checked={borderStyle === 'circle'}
                        onChange={(e) => setBorderStyle(e.target.value)}
                      />
                      <span>Circle</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="rounded"
                        checked={borderStyle === 'rounded'}
                        onChange={(e) => setBorderStyle(e.target.value)}
                      />
                      <span>Rounded</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="square"
                        checked={borderStyle === 'square'}
                        onChange={(e) => setBorderStyle(e.target.value)}
                      />
                      <span>Square</span>
                    </label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="icon-size">Icon Size: {iconSize}px</Label>
                  <Slider
                    id="icon-size"
                    min={16}
                    max={48}
                    step={1}
                    value={[iconSize]}
                    onValueChange={([value]) => setIconSize(value)}
                    className="mt-2"
                  />
                </div>
              </>
            )}

            {/* Live Preview */}
            <div className="pt-4 border-t">
              <Label className="mb-2 block">Preview</Label>
              <SocialMediaPreview
                useStandardLogos={useStandardLogos}
                iconStyle={iconStyle}
                customColor={customColor}
                borderStyle={borderStyle}
                iconSize={iconSize}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FooterSettings;
