import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

// Convert hex color to HSL format for CSS variables
function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}

// Parse color to HSL format - handles both hex and hsl() formats
function parseColorToHSL(color: string): string {
  if (!color) return '221 83% 53%'; // Default blue
  
  // If it's already in HSL format (with or without hsl())
  if (color.includes('hsl')) {
    return color.replace('hsl(', '').replace(')', '').trim();
  }
  
  // If it's hex format
  if (color.startsWith('#')) {
    return hexToHSL(color);
  }
  
  // If it's already in the correct format (e.g., "221 83% 53%")
  if (color.match(/^\d+\s+\d+%\s+\d+%$/)) {
    return color;
  }
  
  return '221 83% 53%'; // Default blue
}

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
      
      // Apply theme colors - convert to HSL format
      if (settings.primary_color) {
        root.style.setProperty('--primary', parseColorToHSL(settings.primary_color));
      }
      if (settings.secondary_color) {
        root.style.setProperty('--secondary', parseColorToHSL(settings.secondary_color));
      }
      if (settings.accent_color) {
        root.style.setProperty('--accent', parseColorToHSL(settings.accent_color));
      }
      
      // Apply border radius
      if (settings.button_border_radius !== undefined) {
        root.style.setProperty('--radius', `${settings.button_border_radius / 16}rem`);
      }
      if (settings.card_border_radius !== undefined) {
        root.style.setProperty('--card-radius', `${settings.card_border_radius / 16}rem`);
      }
    }
  }, [settings]);

  return { data: settings, isLoading };
}
