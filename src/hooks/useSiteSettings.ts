import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export function useSiteSettings() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('*')
        .maybeSingle();
      
      // Return defaults if no settings exist
      if (!data) {
        return {
          header_bg_color: 'hsl(0, 0%, 100%)',
          header_border_color: 'hsl(0, 0%, 89%)',
          header_logo_size: 32,
          footer_bg_color: 'hsl(0, 0%, 96%)',
          footer_text_color: 'hsl(0, 0%, 20%)',
          footer_logo_size: 32,
          show_social_links: false,
          social_icon_style: 'colored',
          social_border_style: 'rounded',
          social_icon_size: 24,
          primary_color: 'hsl(221, 83%, 53%)',
          secondary_color: 'hsl(210, 40%, 96%)',
          accent_color: 'hsl(280, 65%, 60%)',
          button_border_radius: 8,
          card_border_radius: 12,
        };
      }
      
      return data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Apply CSS variables whenever settings change
  useEffect(() => {
    if (settings) {
      const root = document.documentElement;
      
      // Apply header settings
      if (settings.header_bg_color) {
        root.style.setProperty('--header-bg', settings.header_bg_color);
      }
      if (settings.header_border_color) {
        root.style.setProperty('--header-border', settings.header_border_color);
      }
      
      // Apply footer settings
      if (settings.footer_bg_color) {
        root.style.setProperty('--footer-bg', settings.footer_bg_color);
      }
      if (settings.footer_text_color) {
        root.style.setProperty('--footer-text', settings.footer_text_color);
      }
      
      // Apply theme colors
      if (settings.primary_color) {
        root.style.setProperty('--primary', settings.primary_color.replace('hsl(', '').replace(')', ''));
      }
      if (settings.secondary_color) {
        root.style.setProperty('--secondary', settings.secondary_color.replace('hsl(', '').replace(')', ''));
      }
      if (settings.accent_color) {
        root.style.setProperty('--accent', settings.accent_color.replace('hsl(', '').replace(')', ''));
      }
      
      // Apply border radius
      if (settings.button_border_radius !== undefined) {
        root.style.setProperty('--radius', `${settings.button_border_radius / 16}rem`);
      }
    }
  }, [settings]);

  return { data: settings, isLoading };
}
