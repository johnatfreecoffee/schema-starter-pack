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

      // Debounced resize with stabilization
      let resizeTimeout: NodeJS.Timeout | null = null;
      let lastHeight = 0;
      let heightCache: { value: number; timestamp: number } | null = null;
      
      const resize = () => {
        if (!iframe) return;
        
        // Force reflow to ensure layout is complete
        doc.body?.offsetHeight;
        
        const body = doc.body;
        const htmlEl = doc.documentElement;
        const timestamp = Date.now();

        // Measure traditional document heights
        const baseHeight = Math.max(
          body?.scrollHeight || 0,
          body?.offsetHeight || 0,
          htmlEl?.clientHeight || 0,
          htmlEl?.scrollHeight || 0,
          htmlEl?.offsetHeight || 0
        );

        // Optimized element scanning - only check positioned elements and limit iterations
        let maxBottom = 0;
        const MAX_ELEMENTS = 100;
        let checkedCount = 0;
        
        // Only check direct children and positioned elements
        const checkElements = (parent: Element | null) => {
          if (!parent || checkedCount >= MAX_ELEMENTS) return;
          
          const children = parent.children;
          for (let i = 0; i < children.length && checkedCount < MAX_ELEMENTS; i++) {
            const el = children[i] as HTMLElement;
            if (!el || typeof el.getBoundingClientRect !== 'function') continue;
            
            const style = win.getComputedStyle(el);
            const position = style.position;
            
            // Only measure positioned elements and direct children
            if (position === 'absolute' || position === 'fixed' || parent === body) {
              const rect = el.getBoundingClientRect();
              if (rect && isFinite(rect.bottom) && rect.bottom > maxBottom) {
                maxBottom = rect.bottom;
              }
              checkedCount++;
            }
          }
        };
        
        checkElements(body);
        
        const calculatedHeight = Math.ceil(Math.max(baseHeight, maxBottom));
        
        // Use cached value if within 100ms and height hasn't changed significantly
        if (heightCache && timestamp - heightCache.timestamp < 100 && Math.abs(heightCache.value - calculatedHeight) < 5) {
          console.log(`[SiteHTMLIframeRenderer] Using cached height: ${heightCache.value}px`);
          return;
        }
        
        // Update cache
        heightCache = { value: calculatedHeight, timestamp };
        
        // Only update if height changed significantly (avoid micro-adjustments)
        if (Math.abs(lastHeight - calculatedHeight) > 2) {
          console.log(`[SiteHTMLIframeRenderer] Height update: ${lastHeight}px → ${calculatedHeight}px`);
          iframe.style.height = `${calculatedHeight}px`;
          lastHeight = calculatedHeight;
        }
      };
      
      // Debounced resize wrapper
      const debouncedResize = () => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          resize();
          resizeTimeout = null;
        }, 50);
      };

      // Set a reasonable minimum height immediately to ensure visibility
      iframe.style.height = '800px';
      lastHeight = 800;
      
      // Initial resize and then schedule another after scripts/styles settle
      console.log('[SiteHTMLIframeRenderer] Starting resize sequence with initial 800px');
      setTimeout(() => {
        console.log('[SiteHTMLIframeRenderer] Running first resize at 100ms');
        resize();
      }, 100);
      setTimeout(() => {
        console.log('[SiteHTMLIframeRenderer] Running second resize at 300ms');
        resize();
      }, 300);
      setTimeout(() => {
        console.log('[SiteHTMLIframeRenderer] Running third resize at 800ms');
        resize();
      }, 800);
      
      // Final stabilization check at 2 seconds
      setTimeout(() => {
        const currentHeight = parseInt(iframe.style.height) || 0;
        doc.body?.offsetHeight; // Force reflow
        const body = doc.body;
        const htmlEl = doc.documentElement;
        const finalHeight = Math.max(
          body?.scrollHeight || 0,
          body?.offsetHeight || 0,
          htmlEl?.scrollHeight || 0
        );
        
        // Only adjust if difference is significant (>20px)
        if (Math.abs(currentHeight - finalHeight) > 20) {
          console.log(`[SiteHTMLIframeRenderer] Stabilization adjustment: ${currentHeight}px → ${finalHeight}px`);
          iframe.style.height = `${finalHeight}px`;
          lastHeight = finalHeight;
        } else {
          console.log(`[SiteHTMLIframeRenderer] Height stabilized at ${currentHeight}px`);
        }
      }, 2000);

      const win: any = iframe.contentWindow as any;

      // Observe DOM mutations (handles dynamic content injections) - use debounced version
      let mo: MutationObserver | null = null;
      if (win && typeof win.MutationObserver !== 'undefined') {
        mo = new win.MutationObserver(() => debouncedResize());
        mo.observe(doc.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });
      }

      // Observe size changes on both body and html - use debounced version
      let ro: ResizeObserver | null = null;
      if (win && typeof win.ResizeObserver !== 'undefined') {
        ro = new win.ResizeObserver(() => debouncedResize());
        if (doc.body) ro.observe(doc.body);
        if (doc.documentElement) ro.observe(doc.documentElement);
      }

      // Recalculate on image loads and window events - use debounced version
      Array.from(doc.images || []).forEach((img) => {
        img.addEventListener('load', debouncedResize);
        img.addEventListener('error', debouncedResize);
      });
      const onLoad = () => debouncedResize();
      iframe.contentWindow?.addEventListener('load', onLoad);
      iframe.contentWindow?.addEventListener('resize', onLoad);

      return () => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        iframe.contentWindow?.removeEventListener('load', onLoad);
        iframe.contentWindow?.removeEventListener('resize', onLoad);
        iframe.contentWindow?.removeEventListener('load', attachClickListener);
        if (ro) ro.disconnect();
        if (mo) mo.disconnect();
        doc.removeEventListener('click', onClick, { capture: true });
        Array.from(doc.images || []).forEach((img) => {
          img.removeEventListener('load', debouncedResize);
          img.removeEventListener('error', debouncedResize);
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
      style={{ width: '100%', display: 'block', minHeight: '400px' }}
      title="Static Page Content"
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation-by-user-activation"
    />
  );
};

export default SiteHTMLIframeRenderer;
