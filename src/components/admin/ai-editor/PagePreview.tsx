import { useState } from 'react';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PagePreviewProps {
  content: string;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';

const PagePreview = ({ content }: PagePreviewProps) => {
  const [device, setDevice] = useState<DeviceType>('desktop');

  const getWidth = () => {
    switch (device) {
      case 'mobile':
        return '375px';
      case 'tablet':
        return '768px';
      default:
        return '100%';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Preview</h3>
        <div className="flex gap-2">
          <Button
            variant={device === 'desktop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDevice('desktop')}
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            variant={device === 'tablet' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDevice('tablet')}
          >
            <Tablet className="h-4 w-4" />
          </Button>
          <Button
            variant={device === 'mobile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDevice('mobile')}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border rounded-lg bg-muted/30 overflow-auto" style={{ height: 'calc(100vh - 300px)' }}>
        <div className="flex justify-center p-4">
          <div
            className="bg-background border rounded shadow-sm overflow-auto transition-all duration-300"
            style={{
              width: getWidth(),
              maxWidth: '100%',
              minHeight: '500px',
            }}
          >
            <div
              className="prose prose-sm max-w-none p-6"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PagePreview;