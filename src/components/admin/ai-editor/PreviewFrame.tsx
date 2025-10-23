import { useEffect, useRef } from 'react';

interface PreviewFrameProps {
  html: string;
  className?: string;
}

const normalizeHtml = (html: string) => {
  if (!html) return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body></body></html>';
  const hasHtml = /<html[\s>]/i.test(html);
  const hasBody = /<body[\s>]/i.test(html);
  if (hasHtml && hasBody) return html;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>html,body{margin:0;padding:0;min-height:100%;background:#ffffff;color:#111111;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;}</style></head><body>${html}</body></html>`;
};

export default function PreviewFrame({ html, className }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const doc = iframe.contentDocument;
      if (!doc) return;

      const content = normalizeHtml(html);
      doc.open();
      doc.write(content);
      doc.close();

      requestAnimationFrame(() => {
        try {
          const children = doc.body?.children?.length ?? 0;
          console.log('🧪 PreviewFrame write complete', { children, length: content.length });
        } catch (e) {
          console.warn('PreviewFrame debug error', e);
        }
      });
    } catch (e) {
      console.error('PreviewFrame write failed', e);
    }
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      className={className || 'absolute inset-0 w-full h-full border-0'}
      title="Page Preview"
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
    />
  );
}
