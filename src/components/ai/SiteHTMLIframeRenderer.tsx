import React, { useEffect, useRef } from 'react';
import { useLeadFormModal } from '@/hooks/useLeadFormModal';

interface SiteHTMLIframeRendererProps {
  html: string;
  className?: string;
}

// Minimal CTA normalization for iframe content
const normalizeCTAs = (input: string) => {
  console.log('[SiteHTMLIframeRenderer] BEFORE normalization:', input.substring(0, 1000));
  let out = input || '';
  // openLeadFormModal in onclick
  out = out.replace(/onclick\s*=\s*"[^"]*openLeadFormModal\([^)]*\)[^"]*"/gi, (m) => {
    const a = m.match(/openLeadFormModal\(\s*['"]\s*([^'"]*)\s*['"]\s*[,)]/i);
    const header = a ? a[1] : 'Request a Free Quote';
    return `data-lead-form="${header.replace(/"/g, '&quot;')}"`;
  });
  out = out.replace(/onclick\s*=\s*'[^']*openLeadFormModal\([^)]*\)[^']*'/gi, (m) => {
    const a = m.match(/openLeadFormModal\(\s*['"]\s*([^'"]*)\s*['"]\s*[,)]/i);
    const header = a ? a[1] : 'Request a Free Quote';
    return `data-lead-form="${header.replace(/"/g, '&quot;')}"`;
  });
  // href="javascript:openLeadFormModal(...)"
  out = out.replace(/href\s*=\s*"javascript:[^"]*openLeadFormModal\(([^)]*)\)[^"]*"/gi, (_m, args) => {
    let header = 'Request a Free Quote';
    const mm = String(args).match(/['"]\s*([^'"\)]*?)\s*['"]/);
    if (mm) header = mm[1];
    return `data-lead-form="${header.replace(/"/g, '&quot;')}" href="#"`;
  });
  out = out.replace(/href\s*=\s*'javascript:[^']*openLeadFormModal\(([^)]*)\)[^']*'/gi, (_m, args) => {
    let header = 'Request a Free Quote';
    const mm = String(args).match(/['"]\s*([^'"\)]*?)\s*['"]/);
    if (mm) header = mm[1];
    return `data-lead-form="${header.replace(/"/g, '&quot;')}" href="#"`;
  });

  // Convert common navigation onclicks to data-href
  const toDataHref = (attr: string): string | null => {
    let m = attr.match(/window\.open\(\s*['\"]([^'\"]+)['\"][^)]*\)/i);
    if (m) return m[1];
    m = attr.match(/(?:window\.)?(?:location(?:\.href)?|document\.location(?:\.href)?)\s*=\s*['\"]([^'\"]+)['\"]/i);
    if (m) return m[1];
    m = attr.match(/(?:window\.)?location\.(?:assign|replace)\(\s*['\"]([^'\"]+)['\"]\s*\)/i);
    if (m) return m[1];
    m = attr.match(/(tel:[^'"\s)]+|mailto:[^'"\s)]+)/i);
    if (m) return m[1];
    return null;
  };

  out = out.replace(/onclick\s*=\s*"([^"]*)"/gi, (full, attr) => {
    const url = toDataHref(attr);
    if (url) return `data-href="${url.replace(/"/g, '&quot;')}"`;
    return full;
  });
  out = out.replace(/onclick\s*=\s*'([^']*)'/gi, (full, attr) => {
    const url = toDataHref(attr);
    if (url) return `data-href="${url.replace(/"/g, '&quot;')}"`;
    return full;
  });

  // Remove remaining onclicks for safety
  out = out.replace(/\sonclick\s*=\s*"[^"]*"/gi, '');
  out = out.replace(/\sonclick\s*=\s*'[^']*'/gi, '');
  console.log('[SiteHTMLIframeRenderer] AFTER normalization:', out.substring(0, 1000));
  return out;
};

const SiteHTMLIframeRenderer: React.FC<SiteHTMLIframeRendererProps> = ({ html, className }) => {
  const ref = useRef<HTMLIFrameElement>(null);
  const { openModal } = useLeadFormModal();

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    try {
      doc.open();

      if (!html || html.trim().length === 0) {
        const emptyHtml = '<!doctype html><html><head><meta charset="utf-8"/></head><body style="margin:0;padding:24px;font-family:system-ui, -apple-system, sans-serif;color:#111"><p>No content to display.</p></body></html>';
        doc.write(emptyHtml);
        doc.close();
        iframe.style.height = '200px';
        return;
      }

      // Normalize CTAs before writing, then write the processed HTML
      const processed = normalizeCTAs(html);
      doc.write(processed);
      
      // Inject postMessage bridge for onclick fallback
      const bridgeScript = doc.createElement('script');
      bridgeScript.textContent = `
        window.openLeadFormModal = function(header) {
          console.log('[Iframe Bridge] openLeadFormModal called with:', header);
          window.parent.postMessage({ 
            type: 'OPEN_LEAD_FORM', 
            header: header || 'Request a Free Quote'
          }, '*');
        };
      `;
      doc.head.appendChild(bridgeScript);
      doc.close();

      // Click handling inside iframe: open lead form, tel/mailto, data-href
      const onClick = (e: Event) => {
        const target = e.target as HTMLElement | null;
        if (!target) return;

        // Lead form buttons
        const leadEl = (target.closest('[data-lead-form]') as HTMLElement) || null;
        if (leadEl) {
          const header = leadEl.getAttribute('data-lead-form') || 'Request a Free Quote';
          console.info('[SiteHTMLIframeRenderer] Opening lead form', { header, origin: window.location.href });
          openModal(header, { originatingUrl: window.location.href });
          e.preventDefault();
          return;
        }

        // data-href navigation
        const dataHrefEl = (target.closest('[data-href]') as HTMLElement) || null;
        if (dataHrefEl) {
          const url = dataHrefEl.getAttribute('data-href');
          if (url) {
            // Special handling for tel:, mailto:, sms: protocols - synchronous anchor click within iframe
            if (url.startsWith('tel:') || url.startsWith('mailto:') || url.startsWith('sms:')) {
              console.log('[SiteHTMLIframeRenderer] Triggering special protocol via iframe anchor:', url);
              
              // Create anchor within iframe's own document to preserve user gesture
              const iframeDoc = (e.target as HTMLElement).ownerDocument;
              const tempLink = iframeDoc.createElement('a');
              tempLink.href = url;
              tempLink.style.display = 'none';
              
              iframeDoc.body.appendChild(tempLink);
              tempLink.click();
              
              setTimeout(() => {
                iframeDoc.body.removeChild(tempLink);
              }, 100);
              
              e.preventDefault();
              return;
            }
            
            const targetAttr = dataHrefEl.getAttribute('target');
            if (targetAttr === '_blank') {
              window.open(url, '_blank', 'noopener,noreferrer');
            } else {
              window.location.href = url;
            }
            e.preventDefault();
            return;
          }
        }

        // tel:, mailto:, sms: links
        const anchor = target.closest('a') as HTMLAnchorElement | null;
        if (anchor?.href) {
          const href = anchor.href;
          if (href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('sms:')) {
            // Allow default behavior for these special protocols
            return;
          }
        }

        // Accordion click handling
        const accordionHeader = target.closest('.accordion-header') as HTMLElement;
        if (accordionHeader) {
          const content = accordionHeader.nextElementSibling as HTMLElement;
          const icon = accordionHeader.querySelector('svg');
          const isActive = content?.classList.contains('active');
          
          // Close all accordions
          doc.querySelectorAll('.accordion-content').forEach(item => {
            item.classList.remove('active');
          });
          doc.querySelectorAll('.accordion-header svg').forEach(svg => {
            (svg as SVGElement).style.transform = 'rotate(0deg)';
          });
          
          // Open clicked accordion if it wasn't active
          if (!isActive && content) {
            content.classList.add('active');
            if (icon) {
              (icon as SVGElement).style.transform = 'rotate(180deg)';
            }
          }
          
          e.preventDefault();
          return;
        }

        // Tab click handling (for templates with tabs)
        const tabButton = target.closest('.tab-button') as HTMLElement;
        if (tabButton) {
          const tabId = tabButton.getAttribute('data-tab');
          if (tabId) {
            // Remove active from all tabs
            doc.querySelectorAll('.tab-button').forEach(btn => {
              btn.classList.remove('active');
            });
            doc.querySelectorAll('.tab-content').forEach(content => {
              content.classList.remove('active');
            });
            
            // Add active to clicked tab
            tabButton.classList.add('active');
            const targetContent = doc.getElementById(tabId);
            if (targetContent) {
              targetContent.classList.add('active');
            }
          }
          
          e.preventDefault();
          return;
        }
      };

      // Attach click listener AFTER iframe content loads
      const attachClickListener = () => {
        doc.addEventListener('click', onClick, { capture: true });
        console.log('[SiteHTMLIframeRenderer] Click listener attached');
      };

      // Use iframe load event for better timing
      if (iframe.contentWindow) {
        iframe.contentWindow.addEventListener('load', attachClickListener, { once: true });
        // Fallback: attach immediately if already loaded
        if (doc.readyState === 'complete') {
          attachClickListener();
        }
      }

      const resize = () => {
        if (!iframe) return;
        const body = doc.body;
        const htmlEl = doc.documentElement;

        // Measure traditional document heights
        const baseHeight = Math.max(
          body?.scrollHeight || 0,
          body?.offsetHeight || 0,
          htmlEl?.clientHeight || 0,
          htmlEl?.scrollHeight || 0,
          htmlEl?.offsetHeight || 0
        );

        // Also account for absolutely/fixed positioned elements that don't
        // contribute to scroll/offset heights
        let maxBottom = 0;
        const nodes = body?.getElementsByTagName('*') || [];
        for (let i = 0; i < (nodes as any).length; i++) {
          const el = (nodes as any)[i] as HTMLElement;
          if (!el || typeof el.getBoundingClientRect !== 'function') continue;
          const rect = el.getBoundingClientRect();
          if (rect && isFinite(rect.bottom)) {
            if (rect.bottom > maxBottom) maxBottom = rect.bottom;
          }
        }

        const height = Math.ceil(Math.max(baseHeight, maxBottom));
        iframe.style.height = `${height}px`;
      };

      // Initial resize and then schedule another after scripts/styles settle
      resize();
      setTimeout(resize, 100);
      setTimeout(resize, 300);
      setTimeout(resize, 800);

      const win: any = iframe.contentWindow as any;

      // Observe DOM mutations (handles dynamic content injections)
      let mo: MutationObserver | null = null;
      if (win && typeof win.MutationObserver !== 'undefined') {
        mo = new win.MutationObserver(() => resize());
        mo.observe(doc.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });
      }

      // Observe size changes on both body and html
      let ro: ResizeObserver | null = null;
      if (win && typeof win.ResizeObserver !== 'undefined') {
        ro = new win.ResizeObserver(() => resize());
        if (doc.body) ro.observe(doc.body);
        if (doc.documentElement) ro.observe(doc.documentElement);
      }

      // Recalculate on image loads and window events
      Array.from(doc.images || []).forEach((img) => {
        img.addEventListener('load', resize);
        img.addEventListener('error', resize);
      });
      const onLoad = () => resize();
      iframe.contentWindow?.addEventListener('load', onLoad);
      iframe.contentWindow?.addEventListener('resize', onLoad);

      // Fallback: periodic check
      const interval = setInterval(resize, 1000);
      (iframe as any)._resizeInterval = interval;

      return () => {
        iframe.contentWindow?.removeEventListener('load', onLoad);
        iframe.contentWindow?.removeEventListener('resize', onLoad);
        iframe.contentWindow?.removeEventListener('load', attachClickListener);
        if ((iframe as any)._resizeInterval) clearInterval((iframe as any)._resizeInterval);
        if (ro) ro.disconnect();
        if (mo) mo.disconnect();
        doc.removeEventListener('click', onClick, { capture: true });
        Array.from(doc.images || []).forEach((img) => {
          img.removeEventListener('load', resize);
          img.removeEventListener('error', resize);
        });
      };
    } catch (e) {
      console.error('SiteHTMLIframeRenderer write error:', e);
    }
  }, [html, openModal]);

  // Parent window message listener for postMessage bridge
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'OPEN_LEAD_FORM') {
        console.log('[SiteHTMLIframeRenderer] Received postMessage:', event.data);
        openModal(event.data.header || 'Request a Free Quote', { 
          originatingUrl: window.location.href 
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [openModal]);

  return (
    <iframe
      ref={ref}
      className={className || 'w-full border-0'}
      style={{ width: '100%', display: 'block', height: '100vh' }}
      title="Static Page Content"
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation-by-user-activation"
    />
  );
};

export default SiteHTMLIframeRenderer;
