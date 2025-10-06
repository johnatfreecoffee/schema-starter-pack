import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import ColorPicker from './ColorPicker';

const HeaderSettings = () => {
  const queryClient = useQueryClient();
  const [logoSize, setLogoSize] = useState(40);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [borderColor, setBorderColor] = useState('#e5e7eb');

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
      setLogoSize(settings.header_logo_size);
      setBgColor(settings.header_bg_color);
      setBorderColor(settings.header_border_color);
      
      // Apply to CSS variables
      document.documentElement.style.setProperty('--header-logo-size', `${settings.header_logo_size}px`);
      document.documentElement.style.setProperty('--header-bg', settings.header_bg_color);
      document.documentElement.style.setProperty('--header-border', settings.header_border_color);
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      
      // Apply to CSS variables immediately
      document.documentElement.style.setProperty('--header-logo-size', `${data.header_logo_size}px`);
      document.documentElement.style.setProperty('--header-bg', data.header_bg_color);
      document.documentElement.style.setProperty('--header-border', data.header_border_color);
      
      toast.success('Header settings saved successfully');
    },
    onError: () => {
      toast.error('Failed to save header settings');
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      header_logo_size: logoSize,
      header_bg_color: bgColor,
      header_border_color: borderColor,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="logo-size">Logo Size: {logoSize}px</Label>
        <Slider
          id="logo-size"
          min={16}
          max={80}
          step={1}
          value={[logoSize]}
          onValueChange={([value]) => setLogoSize(value)}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="header-bg">Header Background Color</Label>
        <ColorPicker
          value={bgColor}
          onChange={setBgColor}
          label="Header Background"
        />
      </div>

      <div>
        <Label htmlFor="header-border">Header Border Color</Label>
        <ColorPicker
          value={borderColor}
          onChange={setBorderColor}
          label="Header Border"
        />
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Header Settings'}
        </Button>
      </div>
    </div>
  );
};

export default HeaderSettings;
