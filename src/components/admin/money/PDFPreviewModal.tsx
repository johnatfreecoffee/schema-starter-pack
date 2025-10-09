import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Mail, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PDFPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfBlob: Blob;
  documentType: 'quote' | 'invoice';
  documentNumber: string;
  onDownload: () => void;
  onEmail: () => void;
}

const PDFPreviewModal = ({
  open,
  onOpenChange,
  pdfBlob,
  documentType,
  documentNumber,
  onDownload,
  onEmail,
}: PDFPreviewModalProps) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');

  useEffect(() => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [pdfBlob]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              {documentType === 'quote' ? 'Quote' : 'Invoice'} #{documentNumber} Preview
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={onEmail}>
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 border rounded-lg overflow-hidden bg-gray-100">
          {pdfUrl && (
            <iframe
              src={pdfUrl}
              className="w-full h-full"
              title="PDF Preview"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFPreviewModal;
