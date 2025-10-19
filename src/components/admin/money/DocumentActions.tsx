import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Mail, Eye } from 'lucide-react';
import { useGeneratePDF } from '@/hooks/useGeneratePDF';
import PDFPreviewModal from './PDFPreviewModal';
import EmailPDFDialog from './EmailPDFDialog';

interface DocumentActionsProps {
  documentType: 'quote' | 'invoice';
  documentId: string;
  documentNumber: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
  customerEmail?: string;
  className?: string;
}

const DocumentActions = ({
  documentType,
  documentId,
  documentNumber,
  lineItems,
  customerEmail,
  className,
}: DocumentActionsProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  
  const { isGenerating, generateQuotePDF, generateInvoicePDF } = useGeneratePDF();

  const handlePreview = async () => {
    const blob = documentType === 'quote'
      ? await generateQuotePDF(documentId, lineItems)
      : await generateInvoicePDF(documentId, lineItems);
    
    if (blob) {
      setPdfBlob(blob);
      setShowPreview(true);
    }
  };

  const handleDownload = async () => {
    if (documentType === 'quote') {
      await generateQuotePDF(documentId, lineItems, true);
    } else {
      await generateInvoicePDF(documentId, lineItems, true);
    }
  };

  const handleEmail = async () => {
    const blob = documentType === 'quote'
      ? await generateQuotePDF(documentId, lineItems)
      : await generateInvoicePDF(documentId, lineItems);
    
    if (blob) {
      setPdfBlob(blob);
      setShowEmailDialog(true);
    }
  };

  return (
    <>
      <div className={`flex gap-2 ${className || ''}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreview}
          disabled={isGenerating}
        >
          <Eye className="h-4 w-4 mr-2" />
          {isGenerating ? 'Generating...' : 'Preview PDF'}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={isGenerating}
        >
          <Download className="h-4 w-4 mr-2" />
          {isGenerating ? 'Generating...' : 'Download PDF'}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleEmail}
          disabled={isGenerating}
        >
          <Mail className="h-4 w-4 mr-2" />
          {isGenerating ? 'Preparing...' : 'Email PDF'}
        </Button>
      </div>

      {pdfBlob && (
        <>
          <PDFPreviewModal
            open={showPreview}
            onOpenChange={setShowPreview}
            pdfBlob={pdfBlob}
            documentType={documentType}
            documentNumber={documentNumber}
            onDownload={handleDownload}
            onEmail={() => {
              setShowPreview(false);
              setShowEmailDialog(true);
            }}
          />

          <EmailPDFDialog
            open={showEmailDialog}
            onOpenChange={setShowEmailDialog}
            documentType={documentType}
            documentId={documentId}
            documentNumber={documentNumber}
            pdfBlob={pdfBlob}
            defaultEmail={customerEmail}
          />
        </>
      )}
    </>
  );
};

export default DocumentActions;
