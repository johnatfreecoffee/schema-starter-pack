import { useState } from 'react';
import JSZip from 'jszip';
import { PDFGenerator } from '@/lib/pdfGenerator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const MAX_BULK_EXPORT = 50;

function sanitizeFilename(text: string, maxLength: number = 30): string {
  return text
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, maxLength);
}

export function useBulkPDFExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const { toast } = useToast();

  const exportQuotesToZip = async (quoteIds: string[]) => {
    if (quoteIds.length > MAX_BULK_EXPORT) {
      toast({
        title: 'Too Many Documents',
        description: `Maximum ${MAX_BULK_EXPORT} documents per bulk export. Selected: ${quoteIds.length}`,
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    setProgress({ current: 0, total: quoteIds.length });

    try {
      const zip = new JSZip();
      const generator = new PDFGenerator();

      for (let i = 0; i < quoteIds.length; i++) {
        const quoteId = quoteIds[i];
        setProgress({ current: i + 1, total: quoteIds.length });

        try {
          // Fetch quote with line items
          const { data: quote, error: quoteError } = await supabase
            .from('quotes')
            .select(`
              *,
              quote_items (description, quantity, unit_price, amount),
              accounts (account_name)
            `)
            .eq('id', quoteId)
            .single();

          if (quoteError) throw quoteError;

          const lineItems = quote.quote_items || [];
          if (lineItems.length === 0) {
            console.warn(`Quote ${quote.quote_number} has no items, skipping...`);
            continue;
          }

          const blob = await generator.generateQuotePDF(quoteId, lineItems);
          
          const customerName = sanitizeFilename(quote.accounts?.account_name || 'Customer');
          const filename = `Quote_${quote.quote_number}_${customerName}.pdf`;
          
          zip.file(filename, blob);
        } catch (error) {
          console.error(`Error generating PDF for quote ${quoteId}:`, error);
          // Continue with next quote even if one fails
        }
      }

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const zipFilename = `Quotes_Bulk_Export_${dateStr}.zip`;

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = zipFilename;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Complete',
        description: `Successfully exported ${quoteIds.length} quotes`,
      });
    } catch (error: any) {
      console.error('Error during bulk export:', error);
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export quotes',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const exportInvoicesToZip = async (invoiceIds: string[]) => {
    if (invoiceIds.length > MAX_BULK_EXPORT) {
      toast({
        title: 'Too Many Documents',
        description: `Maximum ${MAX_BULK_EXPORT} documents per bulk export. Selected: ${invoiceIds.length}`,
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    setProgress({ current: 0, total: invoiceIds.length });

    try {
      const zip = new JSZip();
      const generator = new PDFGenerator();

      for (let i = 0; i < invoiceIds.length; i++) {
        const invoiceId = invoiceIds[i];
        setProgress({ current: i + 1, total: invoiceIds.length });

        try {
          // Fetch invoice with line items
          const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .select(`
              *,
              invoice_items (description, quantity, unit_price, amount),
              accounts (account_name)
            `)
            .eq('id', invoiceId)
            .single();

          if (invoiceError) throw invoiceError;

          const lineItems = invoice.invoice_items || [];
          if (lineItems.length === 0) {
            console.warn(`Invoice ${invoice.invoice_number} has no items, skipping...`);
            continue;
          }

          const blob = await generator.generateInvoicePDF(invoiceId, lineItems);
          
          const customerName = sanitizeFilename(invoice.accounts?.account_name || 'Customer');
          const filename = `Invoice_${invoice.invoice_number}_${customerName}.pdf`;
          
          zip.file(filename, blob);
        } catch (error) {
          console.error(`Error generating PDF for invoice ${invoiceId}:`, error);
          // Continue with next invoice even if one fails
        }
      }

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const zipFilename = `Invoices_Bulk_Export_${dateStr}.zip`;

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = zipFilename;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Complete',
        description: `Successfully exported ${invoiceIds.length} invoices`,
      });
    } catch (error: any) {
      console.error('Error during bulk export:', error);
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export invoices',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return {
    isExporting,
    progress,
    exportQuotesToZip,
    exportInvoicesToZip,
  };
}
