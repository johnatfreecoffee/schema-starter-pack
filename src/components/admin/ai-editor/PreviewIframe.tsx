import React, { useEffect, useRef } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useCompanySettings } from '@/hooks/useCompanySettings';

interface PreviewIframeProps {
  html: string;
}

const PreviewIframe: React.FC<PreviewIframeProps> = ({ html }) => {
  const ref = useRef<HTMLIFrameElement>(null);
  const { data: siteSettings } = useSiteSettings();
  const { data: companySettings } = useCompanySettings();

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    try {
      doc.open();
      
      // Check if HTML is empty
      if (!html || html.trim().length === 0) {
        const emptyHtml = '<!doctype html><html><head><meta charset="utf-8"/></head><body style="margin:0;padding:24px;font-family:system-ui, -apple-system, sans-serif;color:#111"><p>No content to preview.</p></body></html>';
        doc.write(emptyHtml);
        doc.close();
        return;
      }

      // Process the HTML to inject fallback CSS variables and patch unresolved Handlebars
      let processedHtml = html;
      
      // Define fallback CSS variables
      const settings = siteSettings as any;
      const company = companySettings as any;
      
      const fallbackCssVars = `
        :root {
          --color-primary: ${settings?.primary_color || 'hsl(221 83% 53%)'};
          --color-secondary: ${settings?.secondary_color || 'hsl(210 40% 96%)'};
          --color-accent: ${settings?.accent_color || 'hsl(217 91% 60%)'};
          --color-success: ${settings?.success_color || 'hsl(142 71% 45%)'};
          --color-warning: ${settings?.warning_color || 'hsl(38 92% 50%)'};
          --color-info: ${settings?.info_color || 'hsl(221 83% 53%)'};
          --color-danger: ${settings?.danger_color || 'hsl(0 84% 60%)'};
          --color-bg-primary: ${settings?.bg_primary_color || 'hsl(0 0% 100%)'};
          --color-bg-secondary: ${settings?.bg_secondary_color || 'hsl(210 17% 98%)'};
          --color-bg-tertiary: ${settings?.bg_tertiary_color || 'hsl(214 15% 91%)'};
          --color-text-primary: ${settings?.text_primary_color || 'hsl(222 47% 11%)'};
          --color-text-secondary: ${settings?.text_secondary_color || 'hsl(215 14% 34%)'};
          --color-text-muted: ${settings?.text_muted_color || 'hsl(215 9% 61%)'};
          --color-border: ${settings?.border_color || 'hsl(214 32% 91%)'};
          --color-card-bg: ${settings?.card_bg_color || 'hsl(0 0% 100%)'};
          --color-feature: ${settings?.feature_color || 'hsl(217 91% 60%)'};
          --color-cta: ${settings?.cta_color || 'hsl(142 76% 36%)'};
          --radius-button: ${settings?.button_border_radius || 8}px;
          --radius-card: ${settings?.card_border_radius || 12}px;
          --icon-stroke-width: ${settings?.icon_stroke_width || 2};
        }
      `;
      
      // Patch unresolved Handlebars variables with fallback values
      const fallbackData: Record<string, string> = {
        'business_name': company?.business_name || 'Our Company',
        'phone': company?.phone || '(555) 123-4567',
        'email': company?.email || 'info@company.com',
        'address': company?.address || '123 Main St',
        'years_experience': company?.years_experience?.toString() || '10',
        'siteSettings.primary_color': settings?.primary_color || 'hsl(221 83% 53%)',
        'siteSettings.secondary_color': settings?.secondary_color || 'hsl(210 40% 96%)',
        'siteSettings.accent_color': settings?.accent_color || 'hsl(217 91% 60%)',
        'siteSettings.success_color': settings?.success_color || 'hsl(142 71% 45%)',
        'siteSettings.warning_color': settings?.warning_color || 'hsl(38 92% 50%)',
        'siteSettings.info_color': settings?.info_color || 'hsl(221 83% 53%)',
        'siteSettings.danger_color': settings?.danger_color || 'hsl(0 84% 60%)',
        'siteSettings.bg_primary_color': settings?.bg_primary_color || 'hsl(0 0% 100%)',
        'siteSettings.bg_secondary_color': settings?.bg_secondary_color || 'hsl(210 17% 98%)',
        'siteSettings.bg_tertiary_color': settings?.bg_tertiary_color || 'hsl(214 15% 91%)',
        'siteSettings.text_primary_color': settings?.text_primary_color || 'hsl(222 47% 11%)',
        'siteSettings.text_secondary_color': settings?.text_secondary_color || 'hsl(215 14% 34%)',
        'siteSettings.text_muted_color': settings?.text_muted_color || 'hsl(215 9% 61%)',
        'siteSettings.border_color': settings?.border_color || 'hsl(214 32% 91%)',
        'siteSettings.card_bg_color': settings?.card_bg_color || 'hsl(0 0% 100%)',
        'siteSettings.feature_color': settings?.feature_color || 'hsl(217 91% 60%)',
        'siteSettings.cta_color': settings?.cta_color || 'hsl(142 76% 36%)',
        'siteSettings.button_border_radius': settings?.button_border_radius?.toString() || '8',
        'siteSettings.card_border_radius': settings?.card_border_radius?.toString() || '12',
        'siteSettings.icon_stroke_width': settings?.icon_stroke_width?.toString() || '2',
      };
      
      // Replace all unresolved {{variable}} patterns
      Object.entries(fallbackData).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{\\s*${key.replace('.', '\\.')}\\s*\\}\\}`, 'g');
        processedHtml = processedHtml.replace(regex, value);
      });
      
      // Inject fallback CSS variables if the HTML has a <style> tag
      if (processedHtml.includes('<style>')) {
        processedHtml = processedHtml.replace('<style>', `<style>${fallbackCssVars}`);
      } else if (processedHtml.includes('</head>')) {
        processedHtml = processedHtml.replace('</head>', `<style>${fallbackCssVars}</style></head>`);
      }
      
      // Check for any remaining unresolved variables and log warning
      const unresolvedMatches = processedHtml.match(/\{\{[^}]+\}\}/g);
      if (unresolvedMatches && unresolvedMatches.length > 0) {
        console.warn('Preview contains unresolved template variables:', [...new Set(unresolvedMatches)]);
      }
      
      doc.write(processedHtml);
      doc.close();
    } catch (e) {
      console.error('PreviewIframe write error:', e);
    }
  }, [html, siteSettings, companySettings]);

  return (
    <iframe
      ref={ref}
      className="absolute inset-0 w-full h-full border-0"
      title="Page Preview"
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      style={{ display: 'block' }}
    />
  );
};

export default PreviewIframe;
