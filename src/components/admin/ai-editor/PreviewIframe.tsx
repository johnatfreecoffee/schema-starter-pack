import React, { useEffect, useRef } from 'react';

interface PreviewIframeProps {
  html: string;
}

const PreviewIframe: React.FC<PreviewIframeProps> = ({ html }) => {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    try {
      doc.open();
      const safeHtml = html && html.trim().length > 0
        ? html
        : '<!doctype html><html><head><meta charset="utf-8"/></head><body style="margin:0;padding:24px;font-family:system-ui, -apple-system, sans-serif;color:#111"><p>No content to preview.</p></body></html>';
      doc.write(safeHtml);
      doc.close();
    } catch (e) {
      console.error('PreviewIframe write error:', e);
    }
  }, [html]);

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
