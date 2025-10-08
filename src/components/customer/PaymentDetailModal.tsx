import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Download, FileText, Calendar, DollarSign } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import InvoiceStatusBadge from '@/components/admin/money/InvoiceStatusBadge';
import QuoteStatusBadge from '@/components/admin/money/QuoteStatusBadge';
import { toast } from 'sonner';

type PaymentDocument = {
  id: string;
  number: string;
  type: 'quote' | 'invoice';
  date: string;
  due_date?: string;
  amount: number;
  status: string;
  account_id: string;
};

interface PaymentDetailModalProps {
  document: PaymentDocument;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PaymentDetailModal = ({ document, open, onOpenChange }: PaymentDetailModalProps) => {
  const handleDownloadPDF = () => {
    toast.info('PDF download feature coming soon');
  };

  const handleAcceptQuote = () => {
    toast.info('Quote acceptance feature coming soon');
  };

  const isOverdue = document.type === 'invoice' && 
    document.due_date && 
    document.status !== 'paid' && 
    new Date() > parseISO(document.due_date);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {document.type === 'quote' ? 'Quote Details' : 'Invoice Details'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {document.type === 'quote' ? 'Quote Number' : 'Invoice Number'}
              </p>
              <p className="font-mono font-semibold text-lg">{document.number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              {document.type === 'quote' ? (
                <QuoteStatusBadge status={document.status as any} />
              ) : (
                <InvoiceStatusBadge status={document.status as any} />
              )}
            </div>
          </div>

          <Separator />

          {/* Date Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {document.type === 'quote' ? 'Quote Date' : 'Invoice Date'}
              </p>
              <p className="font-medium">{format(parseISO(document.date), 'MMMM d, yyyy')}</p>
            </div>
            {document.due_date && (
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Due Date
                </p>
                <p className={`font-medium ${isOverdue ? 'text-destructive' : ''}`}>
                  {format(parseISO(document.due_date), 'MMMM d, yyyy')}
                  {isOverdue && <span className="ml-2 text-xs">(OVERDUE)</span>}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Amount Breakdown */}
          <div className="bg-muted/30 p-4 rounded-lg space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">
                ${(document.amount * 0.9).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (10%)</span>
              <span className="font-medium">
                ${(document.amount * 0.1).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">Total Amount</span>
              <div className="flex items-center gap-1 text-2xl font-bold">
                <DollarSign className="h-5 w-5" />
                {document.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            {document.type === 'invoice' && document.status !== 'paid' && (
              <>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-destructive">Balance Due</span>
                  <div className="flex items-center gap-1 text-xl font-bold text-destructive">
                    <DollarSign className="h-5 w-5" />
                    {document.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Line Items Placeholder */}
          <div>
            <h4 className="font-semibold mb-3">Line Items</h4>
            <div className="border rounded-lg p-4 text-center text-sm text-muted-foreground">
              Line items will be displayed here
            </div>
          </div>

          {/* Payment History for Invoices */}
          {document.type === 'invoice' && (
            <div>
              <h4 className="font-semibold mb-3">Payment History</h4>
              <div className="border rounded-lg p-4 text-center text-sm text-muted-foreground">
                No payments recorded yet
              </div>
            </div>
          )}

          {/* Payment Instructions for Unpaid Invoices */}
          {document.type === 'invoice' && document.status !== 'paid' && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">Payment Instructions</h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Please contact us to arrange payment or use the payment button above.
                Payment methods and instructions will be provided upon request.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleDownloadPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            
            {document.type === 'quote' && document.status === 'sent' && (
              <Button onClick={handleAcceptQuote}>
                Accept Quote
              </Button>
            )}
            
            {document.type === 'invoice' && document.status !== 'paid' && (
              <Button variant="default">
                Pay Now
              </Button>
            )}
          </div>

          {/* Notes Section */}
          <div className="text-xs text-muted-foreground border-t pt-4">
            <p>
              For questions about this {document.type}, please contact us with the {document.type} number: {document.number}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDetailModal;
