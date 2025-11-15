import React from 'react';
import AIHTMLRenderer from '@/components/ai/AIHTMLRenderer';

interface PreviewIframeProps {
  html: string;
}

const PreviewIframe: React.FC<PreviewIframeProps> = ({ html }) => {
  const safeHtml = html && html.trim().length > 0
    ? html
    : '<div style="padding:24px;font-family:system-ui;color:#111"><p>No content to preview.</p></div>';

  return (
    <div className="absolute inset-0 w-full h-full overflow-auto bg-white">
      <AIHTMLRenderer html={safeHtml} />
    </div>
  );
};

export default PreviewIframe;
