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
        // Prefer documentElement for cross-browser correctness
        const body = doc.body;
        const htmlEl = doc.documentElement;
        const height = Math.max(
          body?.scrollHeight || 0,
          body?.offsetHeight || 0,
          htmlEl?.clientHeight || 0,
          htmlEl?.scrollHeight || 0,
          htmlEl?.offsetHeight || 0
        );
        iframe.style.height = `${height}px`;
      };

      // Initial resize
      resize();

      // Observe changes to body size
      const win: any = iframe.contentWindow as any;
      let ro: ResizeObserver | null = null;
      if (win && typeof win.ResizeObserver !== 'undefined') {
        ro = new win.ResizeObserver(() => resize());
        ro.observe(doc.body);
      } else {
        // Fallback: periodic resize
        const interval = setInterval(resize, 500);
        (iframe as any)._resizeInterval = interval;
      }

      const onLoad = () => resize();
      iframe.contentWindow?.addEventListener('load', onLoad);

      return () => {
        iframe.contentWindow?.removeEventListener('load', onLoad);
        if ((iframe as any)._resizeInterval) clearInterval((iframe as any)._resizeInterval);
        if (ro) ro.disconnect();
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
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
    />
  );
};

export default SiteHTMLIframeRenderer;
