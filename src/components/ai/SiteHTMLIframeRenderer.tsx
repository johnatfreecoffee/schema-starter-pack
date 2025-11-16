import React, { useEffect, useRef } from 'react';

interface SiteHTMLIframeRendererProps {
  html: string;
  className?: string;
}

const SiteHTMLIframeRenderer: React.FC<SiteHTMLIframeRendererProps> = ({ html, className }) => {
  const ref = useRef<HTMLIFrameElement>(null);

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

      // Write the provided HTML as-is (allows Tailwind CDN and any inline styles)
      doc.write(html);
      doc.close();

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
        if ((iframe as any)._resizeInterval) clearInterval((iframe as any)._resizeInterval);
        if (ro) ro.disconnect();
        if (mo) mo.disconnect();
        Array.from(doc.images || []).forEach((img) => {
          img.removeEventListener('load', resize);
          img.removeEventListener('error', resize);
        });
      };
    } catch (e) {
      console.error('SiteHTMLIframeRenderer write error:', e);
    }
  }, [html]);

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
