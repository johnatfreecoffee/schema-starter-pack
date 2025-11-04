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

// Keep only <style> tags that include the wrapper id selector inside
const keepScopedStylesOnly = (input: string, wrapperId: string) => {
  return input.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (full, css) => {
    const hasScope = new RegExp(`#${wrapperId}\\b`).test(css);
    return hasScope ? full : '';
  });
};

// Convert <i data-lucide="..."> placeholders into inline SVG for cross-browser rendering
const convertLucidePlaceholdersToSvg = (input: string) => {
  return input.replace(/<i[^>]*data-lucide=\"([^\"]+)\"[^>]*><\/i>/gi, (_m, name) => {
    const n = String(name).toLowerCase();
    switch (n) {
      case 'check-circle':
        return '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
      case 'phone':
        return '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>';
      default:
        return '<svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    }
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
      ADD_TAGS: ['style', 'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'g', 'use', 'defs', 'symbol', 'title', 'desc'],
      ADD_ATTR: [
        'data-lead-form',
        // SVG attributes
        'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'd', 'viewBox', 'xmlns',
        'points', 'x', 'y', 'width', 'height', 'aria-hidden', 'focusable', 'role', 'fill-rule', 'clip-rule'
      ],
    });
    // 4) Drop any <style> that is not scoped to the wrapper id
    const scopedOnly = keepScopedStylesOnly(sanitized, id);
    return { id, html: scopedOnly };
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
