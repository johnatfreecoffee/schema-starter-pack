import React, { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { sanitizeHtml } from '@/lib/sanitize';
import { LeadFormEmbed } from '@/components/lead-form/LeadFormEmbed';

interface AIHTMLRendererProps {
  html: string;
  className?: string;
}

// Utility to generate a short random id suffix
const uid = () => Math.random().toString(36).slice(2, 10);

// Extract AI wrapper id if present, else generate one
const ensureWrapper = (input: string) => {
  const match = input.match(/id=\"(ai-section-[^\"]+)\"/i);
  const id = match?.[1] || `ai-section-${uid()}`;
  return id;
};

// Replace inline onclick openLeadFormModal calls with data-lead-form attributes
const normalizeCTAs = (input: string) => {
  let out = input;
  // capture single-quoted
  out = out.replace(/onclick\s*=\s*"[^"]*openLeadFormModal\(\s*'([^']*)'[^)]*\)"/gi, (_m, p1) => `data-lead-form="${p1.replace(/"/g, '&quot;')}"`);
  // capture double-quoted
  out = out.replace(/onclick\s*=\s*"[^"]*openLeadFormModal\(\s*"([^"]*)"[^)]*\)"/gi, (_m, p1) => `data-lead-form="${p1.replace(/"/g, '&quot;')}"`);
  // Remove any remaining onclick attributes for safety
  out = out.replace(/\sonclick\s*=\s*"[^"]*"/gi, '');
  out = out.replace(/\sonclick\s*=\s*'[^']*'/gi, '');
  return out;
};

// Convert <i data-lucide="..."> placeholders to inline SVG icons
const convertLucidePlaceholdersToSvg = (input: string) => {
  return input.replace(/<i\s+data-lucide="([^"]+)"[^>]*><\/i>/gi, (match, iconName) => {
    const strokeWidth = match.match(/data-stroke-width="([^"]+)"/)?. [1] || '2';
    const className = match.match(/class="([^"]+)"/)?. [1] || '';
    
    // Map of common Lucide icons to inline SVG
    const icons: Record<string, string> = {
      'check': '<path d="M20 6 9 17l-5-5"/>',
      'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
      'chevron-right': '<path d="m9 18 6-6-6-6"/>',
      'star': '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
      'heart': '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
      'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
      'phone': '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
      'mail': '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
      'map-pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    };

    const path = icons[iconName.toLowerCase()] || icons['check'];
    
    return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:inline-block;vertical-align:middle;">${path}</svg>`;
  });
};

// Keep <style> tags - preserve both scoped styles and CSS variables
const keepScopedStylesOnly = (input: string, wrapperId: string) => {
  return input.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (full, css) => {
    const hasScope = new RegExp(`#${wrapperId}\\b`).test(css);
    const definesRootVars = /:root\b|--color-|--radius-|--icon-/i.test(css);

    // Keep styles but don't scope them - let them cascade naturally
    // This ensures portal content has access to CSS variables
    if (definesRootVars || hasScope) {
      return full;
    }

    // Also keep other utility styles (gradients, classes, etc.)
    return full;
  });
};

// Strip Tailwind CDN (or any Tailwind CDN variants) from provided HTML
const stripTailwindCdn = (input: string) => {
  return input.replace(/<script[^>]*src=["']https:\/\/cdn\.tailwindcss\.com[^>]*><\/script>/gi, '');
};

// Replace CSS variable assignments that still contain template placeholders like {{...}}
// with sensible HSL defaults so colors render even if the generator forgot to inject values
const patchCssVariables = (input: string) => {
  const defaults: Record<string, string> = {
    '--color-primary': 'hsl(221 83% 53%)',
    '--color-secondary': 'hsl(262 83% 58%)',
    '--color-accent': 'hsl(16 100% 50%)',
    '--color-success': 'hsl(142 71% 45%)',
    '--color-warning': 'hsl(38 92% 50%)',
    '--color-info': 'hsl(199 89% 48%)',
    '--color-danger': 'hsl(0 84% 60%)',
    '--color-bg-primary': 'hsl(0 0% 100%)',
    '--color-bg-secondary': 'hsl(210 40% 96%)',
    '--color-bg-tertiary': 'hsl(210 40% 98%)',
    '--color-text-primary': 'hsl(222 47% 11%)',
    '--color-text-secondary': 'hsl(215 20% 35%)',
    '--color-text-muted': 'hsl(215 16% 47%)',
    '--color-border': 'hsl(214 32% 91%)',
    '--color-card-bg': 'hsl(0 0% 100%)',
    '--color-feature': 'hsl(240 5% 96%)',
    '--color-cta': 'hsl(221 83% 53%)',
    '--radius-button': '8px',
    '--radius-card': '12px',
    '--icon-stroke-width': '2',
  };

  const replacePlaceholders = (css: string) =>
    css.replace(/(--[a-z0-9-_]+)\s*:\s*([^;]*\{\{[^}]+\}[^;]*);/gi, (_m, name: string) => {
      const key = String(name).toLowerCase();
      const fallback = defaults[key] || (key.includes('radius') ? '8px' : key.includes('icon-stroke-width') ? '2' : 'hsl(221 83% 53%)');
      return `${name}: ${fallback};`;
    });

  return input.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_full, css) => {
    const updated = replacePlaceholders(css);
    return `<style>${updated}</style>`;
  });
};

// Utility CSS for common Tailwind classes that might be in the AI-generated HTML
const utilityCss = `
<style>
  .flex{display:flex}.flex-col{flex-direction:column}.flex-row{flex-direction:row}.items-center{align-items:center}.justify-center{justify-content:center}.justify-between{justify-content:space-between}.gap-2{gap:0.5rem}.gap-4{gap:1rem}.gap-6{gap:1.5rem}.gap-8{gap:2rem}.space-x-2>*+*{margin-left:0.5rem}.space-x-4>*+*{margin-left:1rem}.space-y-2>*+*{margin-top:0.5rem}.space-y-4>*+*{margin-top:1rem}.space-y-6>*+*{margin-top:1.5rem}.p-4{padding:1rem}.p-6{padding:1.5rem}.p-8{padding:2rem}.px-4{padding-left:1rem;padding-right:1rem}.px-6{padding-left:1.5rem;padding-right:1.5rem}.py-2{padding-top:0.5rem;padding-bottom:0.5rem}.py-4{padding-top:1rem;padding-bottom:1rem}.py-6{padding-top:1.5rem;padding-bottom:1.5rem}.py-8{padding-top:2rem;padding-bottom:2rem}.py-12{padding-top:3rem;padding-bottom:3rem}.py-16{padding-top:4rem;padding-bottom:4rem}.pt-8{padding-top:2rem}.pb-8{padding-bottom:2rem}.mt-4{margin-top:1rem}.mt-8{margin-top:2rem}.mb-4{margin-bottom:1rem}.mb-8{margin-bottom:2rem}.w-full{width:100%}.max-w-4xl{max-width:56rem}.max-w-6xl{max-width:72rem}.max-w-7xl{max-width:80rem}.mx-auto{margin-left:auto;margin-right:auto}.text-center{text-align:center}.text-left{text-align:left}.text-sm{font-size:0.875rem}.text-base{font-size:1rem}.text-lg{font-size:1.125rem}.text-xl{font-size:1.25rem}.text-2xl{font-size:1.5rem}.text-3xl{font-size:1.875rem}.text-4xl{font-size:2.25rem}.text-5xl{font-size:3rem}.font-bold{font-weight:700}.font-semibold{font-weight:600}.font-medium{font-weight:500}.rounded{border-radius:0.25rem}.rounded-lg{border-radius:0.5rem}.rounded-xl{border-radius:0.75rem}.rounded-2xl{border-radius:1rem}.rounded-full{border-radius:9999px}.shadow{box-shadow:0 1px 3px 0 rgb(0 0 0/0.1)}.shadow-md{box-shadow:0 4px 6px -1px rgb(0 0 0/0.1)}.shadow-lg{box-shadow:0 10px 15px -3px rgb(0 0 0/0.1)}.shadow-xl{box-shadow:0 20px 25px -5px rgb(0 0 0/0.1)}.grid{display:grid}.grid-cols-1{grid-template-columns:repeat(1,minmax(0,1fr))}.grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}.hidden{display:none}.block{display:block}.inline-block{display:inline-block}.relative{position:relative}.absolute{position:absolute}.opacity-0{opacity:0}.opacity-50{opacity:0.5}.opacity-100{opacity:1}.hover\\\\:opacity-90:hover{opacity:0.9}.transition{transition-property:all;transition-timing-function:cubic-bezier(0.4,0,0.2,1);transition-duration:150ms}.transform{transform:translateX(0) translateY(0) rotate(0) skewX(0) skewY(0) scaleX(1) scaleY(1)}.hover\\\\:scale-105:hover{transform:scale(1.05)}.overflow-hidden{overflow:hidden}.cursor-pointer{cursor:pointer}
</style>
`;

const AIHTMLRenderer: React.FC<AIHTMLRendererProps> = ({ html, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [portalTargets, setPortalTargets] = useState<Array<{
    id: string;
    node: HTMLElement;
    headerText?: string;
  }>>([]);

  // Process and sanitize HTML
  const processed = useMemo(() => {
    if (!html || html.trim().length === 0) {
      return { id: 'empty-wrapper', sanitized: '' };
    }

    const wrapperId = ensureWrapper(html);
    let processedHtml = html;

    // Normalize any CTA buttons
    processedHtml = normalizeCTAs(processedHtml);

    // Convert Lucide icons
    processedHtml = convertLucidePlaceholdersToSvg(processedHtml);

    // Remove Tailwind CDN
    processedHtml = stripTailwindCdn(processedHtml);

    // Patch CSS variables
    processedHtml = patchCssVariables(processedHtml);

    // Keep scoped styles
    processedHtml = keepScopedStylesOnly(processedHtml, wrapperId);

    // Sanitize the HTML
    const sanitized = sanitizeHtml(processedHtml, {
      ALLOWED_TAGS: [
        'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'a', 'img', 'strong', 'em', 'br', 'hr',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'button', 'form', 'input', 'label', 'select', 'option', 'textarea',
        'section', 'article', 'header', 'footer', 'nav', 'aside', 'main',
        'i', 'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon',
        'style'
      ],
      ALLOWED_ATTR: [
        'class', 'id', 'style', 'href', 'src', 'alt', 'title',
        'width', 'height', 'target', 'rel',
        'type', 'name', 'value', 'placeholder',
        'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
        'd', 'cx', 'cy', 'r', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'points',
        'data-lead-form', 'data-form-embed', 'data-form-header', 'data-form',
        'data-form-placeholder', 'data-widget', 'data-component'
      ],
      ALLOW_DATA_ATTR: true,
      ADD_TAGS: ['style'],
      WHOLE_DOCUMENT: false,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
    });

    const finalHtml = `${utilityCss}\n${sanitized}`;

    return { id: wrapperId, sanitized: finalHtml };
  }, [html]);

  // Find form placeholders and set up portal targets
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Multiple selectors to find form embed locations
    const selectors = [
      '[data-form-embed]',
      '[data-form="embed"]',
      '.form-embed',
      '#form-embed',
      '[data-form-placeholder]',
      '[data-widget="lead-form"]',
      '[data-component="lead-form"]'
    ];

    let formPlaceholders = Array.from(
      container.querySelectorAll(selectors.join(','))
    ) as HTMLElement[];

    console.log(`[AIHTMLRenderer] Found ${formPlaceholders.length} form placeholders`);

    // Auto-inject fallback if no placeholders found
    if (formPlaceholders.length === 0) {
      console.log('[AIHTMLRenderer] No form placeholders found, auto-injecting one');
      const auto = document.createElement('div');
      auto.setAttribute('data-form-embed', '1');
      auto.setAttribute('data-auto-injected', 'true');
      auto.style.cssText = 'display:block;width:100%;max-width:960px;margin:24px auto;';
      container.insertBefore(auto, container.firstChild);
      formPlaceholders = [auto];
    }

    // Map placeholders to portal targets
    const targets = formPlaceholders.map((node, index) => ({
      id: node.id || `form-portal-${index}`,
      node,
      headerText: node.getAttribute('data-form-header') || undefined
    }));

    setPortalTargets(targets);

    // Cleanup auto-injected elements on unmount
    return () => {
      container.querySelectorAll('[data-auto-injected="true"]').forEach(el => el.remove());
    };
  }, [processed.id]);

  // Set up global openLeadFormModal function
  useEffect(() => {
    const container = document.getElementById(processed.id);
    if (!container) return;

    (window as any).openLeadFormModal = (headerText: string) => {
      const event = new CustomEvent('open-lead-form', { detail: { headerText } });
      window.dispatchEvent(event);
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const leadFormBtn = target.closest('[data-lead-form]');
      if (leadFormBtn) {
        e.preventDefault();
        const headerText = leadFormBtn.getAttribute('data-lead-form') || 'Get Started';
        const event = new CustomEvent('open-lead-form', { detail: { headerText } });
        window.dispatchEvent(event);
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [processed.id]);

  // Add lazy loading for images
  useEffect(() => {
    const container = document.getElementById(processed.id);
    if (!container) return;

    const images = container.querySelectorAll('img');
    images.forEach(img => {
      img.loading = 'lazy';
      img.onerror = () => {
        img.style.display = 'none';
        console.warn('Failed to load image:', img.src);
      };
    });
  }, [processed.id]);

  return (
    <>
      <div
        ref={containerRef}
        id={processed.id}
        className={className}
        style={{ 
          colorScheme: 'light',
          color: 'hsl(var(--foreground))',
          backgroundColor: 'hsl(var(--background))'
        }}
        dangerouslySetInnerHTML={{ __html: processed.sanitized }}
      />
      
      {/* Create portals for each form placeholder */}
      {portalTargets.map(target => 
        createPortal(
          <div 
            key={target.id}
            style={{
              all: 'initial',
              color: 'hsl(var(--foreground))',
              fontFamily: 'inherit'
            }}
          >
            <div style={{ all: 'revert' }}>
              <LeadFormEmbed 
                headerText={target.headerText}
                showHeader={true}
              />
            </div>
          </div>,
          target.node,
          target.id
        )
      )}
    </>
  );
};

export default AIHTMLRenderer;
