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

const AIHTMLRenderer: React.FC<AIHTMLRendererProps> = ({ html, className }) => {
  const { openModal } = useLeadFormModal();

  const processed = useMemo(() => {
    // 1) Ensure wrapper id
    const { id, html: wrapped } = ensureWrapper(html || '');
    // 2) Normalize CTA handlers to data attributes
    const withCtas = normalizeCTAs(wrapped);
    // 3) Sanitize while allowing <style> and our data attribute
    const sanitized = sanitizeHtml(withCtas, {
      ADD_TAGS: ['style'],
      ADD_ATTR: ['data-lead-form'],
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
