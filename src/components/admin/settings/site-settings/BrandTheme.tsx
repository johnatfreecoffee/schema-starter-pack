import { useEffect, useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cacheInvalidation } from '@/lib/cacheInvalidation';
import ColorPicker from './ColorPicker';

const BrandTheme = () => {
  const queryClient = useQueryClient();
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#8b5cf6');
  const [accentColor, setAccentColor] = useState('#10b981');
  const [buttonRadius, setButtonRadius] = useState(6);
  const [cardRadius, setCardRadius] = useState(8);
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
      setPrimaryColor(settings.primary_color);
      setSecondaryColor(settings.secondary_color);
      setAccentColor(settings.accent_color);
      setButtonRadius(settings.button_border_radius);
      setCardRadius(settings.card_border_radius);
      
      // Apply to CSS variables
      document.documentElement.style.setProperty('--primary-color', settings.primary_color);
      document.documentElement.style.setProperty('--secondary-color', settings.secondary_color);
      document.documentElement.style.setProperty('--accent-color', settings.accent_color);
      document.documentElement.style.setProperty('--button-radius', `${settings.button_border_radius}px`);
      document.documentElement.style.setProperty('--card-radius', `${settings.card_border_radius}px`);
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
      document.documentElement.style.setProperty('--primary-color', data.primary_color);
      document.documentElement.style.setProperty('--secondary-color', data.secondary_color);
      document.documentElement.style.setProperty('--accent-color', data.accent_color);
      document.documentElement.style.setProperty('--button-radius', `${data.button_border_radius}px`);
      document.documentElement.style.setProperty('--card-radius', `${data.card_border_radius}px`);
      
      setIsSaving(false);
    },
    onError: () => {
      toast.error('Failed to save brand theme');
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
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_color: accentColor,
        button_border_radius: buttonRadius,
        card_border_radius: cardRadius,
      });
    }, 1000);
  }, [primaryColor, secondaryColor, accentColor, buttonRadius, cardRadius, updateMutation]);

  useEffect(() => {
    if (settings && settings.id) {
      autoSave();
    }
  }, [primaryColor, secondaryColor, accentColor, buttonRadius, cardRadius]);

  return (
    <div className="space-y-8">
      {isSaving && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Saving...
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Settings */}
        <div className="space-y-8">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Brand Colors</h3>
            
            <div>
              <Label>Primary Color</Label>
              <p className="text-sm text-muted-foreground mb-2">Used for buttons, links, focus states</p>
              <ColorPicker
                value={primaryColor}
                onChange={setPrimaryColor}
                label="Primary Color"
              />
            </div>

            <div>
              <Label>Secondary Color</Label>
              <p className="text-sm text-muted-foreground mb-2">Used for secondary UI elements</p>
              <ColorPicker
                value={secondaryColor}
                onChange={setSecondaryColor}
                label="Secondary Color"
              />
            </div>

            <div>
              <Label>Accent Color</Label>
              <p className="text-sm text-muted-foreground mb-2">Used for success states and highlights</p>
              <ColorPicker
                value={accentColor}
                onChange={setAccentColor}
                label="Accent Color"
              />
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t">
            <h3 className="text-lg font-semibold">Border Radius</h3>
            
            <div>
              <Label htmlFor="button-radius">Button Border Radius: {buttonRadius}px</Label>
              <Slider
                id="button-radius"
                min={0}
                max={20}
                step={1}
                value={[buttonRadius]}
                onValueChange={([value]) => setButtonRadius(value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="card-radius">Card Border Radius: {cardRadius}px</Label>
              <Slider
                id="card-radius"
                min={0}
                max={24}
                step={1}
                value={[cardRadius]}
                onValueChange={([value]) => setCardRadius(value)}
                className="mt-2"
              />
            </div>
          </div>
        </div>

        {/* Right Column - Live Preview */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
            
            {/* Button Examples */}
            <Card className="p-6 space-y-6" style={{ borderRadius: `${cardRadius}px` }}>
              <div>
                <p className="text-sm font-medium mb-3 text-slate-700">Primary Buttons</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="px-4 py-2 text-white font-medium transition-opacity hover:opacity-90"
                    style={{ 
                      backgroundColor: primaryColor,
                      borderRadius: `${buttonRadius}px`
                    }}
                  >
                    Primary Button
                  </button>
                  <button
                    className="px-4 py-2 text-white font-medium opacity-50"
                    style={{ 
                      backgroundColor: primaryColor,
                      borderRadius: `${buttonRadius}px`
                    }}
                  >
                    Disabled
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-3 text-slate-700">Secondary Buttons</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="px-4 py-2 text-white font-medium transition-opacity hover:opacity-90"
                    style={{ 
                      backgroundColor: secondaryColor,
                      borderRadius: `${buttonRadius}px`
                    }}
                  >
                    Secondary Button
                  </button>
                  <button
                    className="px-4 py-2 font-medium border-2 transition-colors hover:bg-opacity-10"
                    style={{ 
                      borderColor: secondaryColor,
                      color: secondaryColor,
                      borderRadius: `${buttonRadius}px`,
                      backgroundColor: 'transparent'
                    }}
                  >
                    Outline
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-3 text-slate-700">Accent / Success Buttons</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="px-4 py-2 text-white font-medium transition-opacity hover:opacity-90"
                    style={{ 
                      backgroundColor: accentColor,
                      borderRadius: `${buttonRadius}px`
                    }}
                  >
                    Success
                  </button>
                  <button
                    className="px-3 py-2 text-sm font-medium transition-opacity hover:opacity-90"
                    style={{ 
                      backgroundColor: accentColor,
                      color: 'white',
                      borderRadius: `${buttonRadius}px`
                    }}
                  >
                    ✓ Complete
                  </button>
                </div>
              </div>
            </Card>

            {/* Website Mockup */}
            <Card className="p-4 bg-slate-50" style={{ borderRadius: `${cardRadius}px` }}>
              <p className="text-sm font-medium mb-4 text-slate-700">Website Preview</p>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ borderRadius: `${cardRadius}px` }}>
                {/* Header */}
                <div className="border-b border-slate-200 p-4 flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-700">Your Business</div>
                  <div className="flex gap-2">
                    <a 
                      href="#"
                      className="text-sm font-medium hover:opacity-80 transition-opacity"
                      style={{ color: primaryColor }}
                      onClick={(e) => e.preventDefault()}
                    >
                      About
                    </a>
                    <a 
                      href="#"
                      className="text-sm font-medium hover:opacity-80 transition-opacity"
                      style={{ color: primaryColor }}
                      onClick={(e) => e.preventDefault()}
                    >
                      Services
                    </a>
                  </div>
                </div>

                {/* Hero Section */}
                <div className="p-6 text-center">
                  <h2 className="text-lg font-bold text-slate-900 mb-2">Welcome to Your Site</h2>
                  <p className="text-sm text-slate-600 mb-4">Experience the power of your brand colors</p>
                  <button
                    className="px-6 py-2 text-white font-medium transition-opacity hover:opacity-90 inline-block"
                    style={{ 
                      backgroundColor: primaryColor,
                      borderRadius: `${buttonRadius}px`
                    }}
                  >
                    Get Started
                  </button>
                </div>

                {/* Feature Cards */}
                <div className="p-4 grid grid-cols-2 gap-3">
                  <div 
                    className="p-3 border"
                    style={{ 
                      borderColor: secondaryColor,
                      borderRadius: `${cardRadius}px`
                    }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full mb-2 flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      1
                    </div>
                    <p className="text-xs font-medium text-slate-700">Feature One</p>
                  </div>
                  <div 
                    className="p-3 bg-opacity-10"
                    style={{ 
                      backgroundColor: accentColor,
                      borderRadius: `${cardRadius}px`
                    }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full mb-2 flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: accentColor }}
                    >
                      ✓
                    </div>
                    <p className="text-xs font-medium text-slate-700">Success Story</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandTheme;
