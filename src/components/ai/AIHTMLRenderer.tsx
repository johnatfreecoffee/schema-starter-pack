import React, { useEffect, useMemo } from 'react';
import { sanitizeHtml } from '@/lib/sanitize';
import { useLeadFormModal } from '@/hooks/useLeadFormModal';

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
  let wrapped = input;
  if (!match) {
    wrapped = `<div id="${id}">${input}</div>`;
  }
  return { id, html: wrapped };
};

// Replace inline onclick openLeadFormModal calls with data-lead-form attributes
const normalizeCTAs = (input: string) => {
  let out = input;
  // capture single-quoted
  out = out.replace(/onclick\s*=\s*"[^"]*openLeadFormModal\(\s*'([^']*)\'[^)]*\)"/gi, (_m, p1) => `data-lead-form="${p1.replace(/"/g, '&quot;')}"`);
  // capture double-quoted
  out = out.replace(/onclick\s*=\s*"[^"]*openLeadFormModal\(\s*\"([^\"]*)\"[^)]*\)"/gi, (_m, p1) => `data-lead-form="${p1.replace(/"/g, '&quot;')}"`);
  // Remove any remaining onclick attributes for safety
  out = out.replace(/\sonclick\s*=\s*"[^"]*"/gi, '');
  out = out.replace(/\sonclick\s*=\s*'[^']*'/gi, '');
  return out;
};

// Keep <style> tags - preserve both scoped styles and CSS variables
const keepScopedStylesOnly = (input: string, wrapperId: string) => {
  return input.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (full, css) => {
    const hasScope = new RegExp(`#${wrapperId}\\b`).test(css);
    const definesRootVars = /:root\b|--color-|--radius-|--icon-/i.test(css);

    // Always keep styles that define CSS variables or are already scoped
    if (definesRootVars || hasScope) {
      // Scope CSS variables to the wrapper so they cascade within this section only
      const scopedCss = css.replace(/:root\b/gi, `#${wrapperId}`);
      return `<style>${scopedCss}<\/style>`;
    }

    // Also keep other utility styles (gradients, classes, etc.)
    return full;
  });
};

// Convert <i data-lucide="..."> placeholders into inline SVG for cross-browser rendering
const convertLucidePlaceholdersToSvg = (input: string) => {
  return input.replace(/<i[^>]*data-lucide=\"([^\"]+)\"[^>]*><\/i>/gi, (_m, name) => {
    const n = String(name).toLowerCase().replace(/[-_]/g, '');
    
    // Map of all icon types used in the HTML
    const icons: Record<string, string> = {
      // Check and verification icons
      'checkcircle': '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      'check': '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
      
      // Communication icons
      'phone': '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>',
      'mail': '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>',
      
      // Alert and status icons
      'alertcircle': '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      'shield': '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>',
      'shieldcheck': '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>',
      
      // Action icons
      'zap': '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>',
      'lightning': '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>',
      'refresh': '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>',
      
      // Location and navigation
      'mappin': '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
      'navigation': '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
      
      // Time and calendar
      'calendar': '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>',
      'clock': '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      
      // Building and property
      'home': '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>',
      'building': '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>',
      
      // Finance and business
      'dollar': '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      'dollarsign': '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      
      // Transportation
      'truck': '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/></svg>',
      
      // People
      'users': '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>',
    };
    
    return icons[n] || '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
  });
};

const AIHTMLRenderer: React.FC<AIHTMLRendererProps> = ({ html, className }) => {
  const { openModal } = useLeadFormModal();

  const processed = useMemo(() => {
    // 1) Ensure wrapper id
    const { id, html: wrapped } = ensureWrapper(html || '');
    // 2) Normalize CTA handlers to data attributes
    const withCtas = normalizeCTAs(wrapped);
    // 3) Convert any lucide placeholders to inline SVG
    const withIcons = convertLucidePlaceholdersToSvg(withCtas);
    // 4) Sanitize while allowing <style> and SVG
    const sanitized = sanitizeHtml(withIcons, {
      ADD_TAGS: ['style', 'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'g', 'use', 'defs', 'symbol', 'title', 'desc', 'button', 'a'],
      ADD_ATTR: [
        'data-lead-form', 'href', 'class', 'style', 'onclick', 'type', 'target', 'rel',
        // SVG attributes
        'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'd', 'viewBox', 'xmlns',
        'points', 'x', 'y', 'width', 'height', 'aria-hidden', 'focusable', 'role', 'fill-rule', 'clip-rule'
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });
    // 5) Keep scoped styles and CSS vars
    const scopedOnly = keepScopedStylesOnly(sanitized, id);
    // 6) Inject minimal utility CSS so Tailwind classes used in templates render
    const utilityCss = `
<style>
#${id} .px-10{padding-left:2.5rem;padding-right:2.5rem;} 
#${id} .py-5{padding-top:1.25rem;padding-bottom:1.25rem;}
#${id} .px-8{padding-left:2rem;padding-right:2rem;}
#${id} .py-4{padding-top:1rem;padding-bottom:1rem;}
#${id} .px-6{padding-left:1.5rem;padding-right:1.5rem;}
#${id} .py-3{padding-top:.75rem;padding-bottom:.75rem;}
#${id} .py-2{padding-top:.5rem;padding-bottom:.5rem;}
#${id} .p-8{padding:2rem;}
#${id} .p-6{padding:1.5rem;}
#${id} .p-4{padding:1rem;}
#${id} .p-3{padding:.75rem;}
#${id} .w-full{width:100%;}
#${id} .inline-block{display:inline-block;}
#${id} .bg-white{background:#fff;}
#${id} .text-white{color:#fff;}
#${id} .bg-white\\/10{background-color:rgba(255,255,255,0.1);}
#${id} .bg-opacity-10{background-color:rgba(255,255,255,0.1);}
#${id} .backdrop-blur-sm{backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);}
#${id} .backdrop-blur{backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}
#${id} .rounded{border-radius:.25rem;}
#${id} .rounded-lg{border-radius:.5rem;}
#${id} .rounded-xl{border-radius:.75rem;}
#${id} .rounded-2xl{border-radius:1rem;}
#${id} .rounded-3xl{border-radius:1.5rem;}
#${id} .font-bold{font-weight:700;}
#${id} .font-semibold{font-weight:600;}
#${id} .text-lg{font-size:1.125rem;line-height:1.75rem;}
#${id} .text-xl{font-size:1.25rem;line-height:1.75rem;}
#${id} .text-2xl{font-size:1.5rem;line-height:2rem;}
#${id} .text-center{text-align:center;}
#${id} .shadow-xl{box-shadow:0 20px 25px -5px rgba(0,0,0,.1),0 10px 10px -5px rgba(0,0,0,.04);} 
#${id} .shadow-2xl{box-shadow:0 25px 50px -12px rgba(0,0,0,.25);} 
#${id} .shadow-lg{box-shadow:0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -2px rgba(0,0,0,.05);}
#${id} .hover\\:scale-105:hover{transform:scale(1.05);} 
#${id} .hover\\:shadow-2xl:hover{box-shadow:0 25px 50px -12px rgba(0,0,0,.25);}
#${id} .transition-all{transition:all .2s ease-in-out;}
#${id} .transition-transform{transition:transform .2s ease-in-out;}
#${id} .flex{display:flex;}
#${id} .inline-flex{display:inline-flex;}
#${id} .grid{display:grid;}
#${id} .grid-cols-1{grid-template-columns:repeat(1,minmax(0,1fr));}
#${id} .grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr));}
#${id} .grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr));}
#${id} .items-center{align-items:center;}
#${id} .justify-center{justify-content:center;}
#${id} .gap-2{gap:.5rem;}
#${id} .gap-3{gap:.75rem;}
#${id} .gap-4{gap:1rem;}
#${id} .gap-6{gap:1.5rem;}
#${id} .gap-8{gap:2rem;}
@media(min-width:640px){
  #${id} .sm\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr));}
  #${id} .sm\\:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr));}
}
@media(min-width:768px){
  #${id} .md\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr));}
  #${id} .md\\:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr));}
  #${id} .md\\:grid-cols-4{grid-template-columns:repeat(4,minmax(0,1fr));}
}
@media(min-width:1024px){
  #${id} .lg\\:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr));}
  #${id} .lg\\:grid-cols-4{grid-template-columns:repeat(4,minmax(0,1fr));}
  #${id} .lg\\:grid-cols-6{grid-template-columns:repeat(6,minmax(0,1fr));}
}
</style>`;

    return { id, html: scopedOnly + utilityCss };
  }, [html]);

  useEffect(() => {
    // Bridge for inline calls if some remain
    // @ts-ignore
    window.openLeadFormModal = (headerText: string) => {
      openModal(headerText, { originatingUrl: window.location.href });
    };

    const container = document.getElementById(processed.id);
    if (!container) return;

    const onClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const el = target.closest('[data-lead-form]') as HTMLElement | null;
      if (el) {
        const header = el.getAttribute('data-lead-form') || 'Request a Free Quote';
        openModal(header, { originatingUrl: window.location.href });
        e.preventDefault();
      }
    };

    container.addEventListener('click', onClick);
    return () => {
      container.removeEventListener('click', onClick);
    };
  }, [processed.id, openModal]);

  return (
    <div
      className={className}
      // Intentionally render the sanitized + scoped HTML
      dangerouslySetInnerHTML={{ __html: processed.html }}
    />
  );
};

export default AIHTMLRenderer;
