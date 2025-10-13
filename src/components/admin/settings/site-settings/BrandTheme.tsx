import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
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
      
      toast.success('Brand theme saved successfully');
    },
    onError: () => {
      toast.error('Failed to save brand theme');
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      accent_color: accentColor,
      button_border_radius: buttonRadius,
      card_border_radius: cardRadius,
    });
  };

  return (
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
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Preview:</p>
            <Button style={{ borderRadius: `${buttonRadius}px` }}>Sample Button</Button>
          </div>
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
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Preview:</p>
            <Card className="p-4" style={{ borderRadius: `${cardRadius}px` }}>
              <p className="text-sm">Sample card with custom border radius</p>
            </Card>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Brand Theme'}
        </Button>
      </div>
    </div>
  );
};

export default BrandTheme;
