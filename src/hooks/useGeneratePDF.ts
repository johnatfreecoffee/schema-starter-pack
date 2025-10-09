import { useState } from 'react';
import { PDFGenerator, uploadDocumentToStorage } from '@/lib/pdfGenerator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CRUDLogger } from '@/lib/crudLogger';

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export function useGeneratePDF() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateQuotePDF = async (
    quoteId: string,
    lineItems: LineItem[],
    download: boolean = false
  ): Promise<Blob | null> => {
    try {
      setIsGenerating(true);
      const generator = new PDFGenerator();
      const blob = await generator.generateQuotePDF(quoteId, lineItems);

      if (download) {
        const { data: quote } = await supabase
          .from('quotes')
          .select('quote_number')
          .eq('id', quoteId)
          .single();

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quote-${quote?.quote_number}.pdf`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
          title: 'Success',
          description: 'Quote PDF downloaded successfully',
        });

        // Log activity
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await CRUDLogger.logUpdate({
            userId: user.id,
            entityType: 'quote',
            entityId: quoteId,
            entityName: quote?.quote_number || '',
            changes: { action: { old: '', new: 'PDF downloaded' } },
          });
        }
      }

      return blob;
    } catch (error: any) {
      console.error('Error generating quote PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate quote PDF',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateInvoicePDF = async (
    invoiceId: string,
    lineItems: LineItem[],
    download: boolean = false
  ): Promise<Blob | null> => {
    try {
      setIsGenerating(true);
      const generator = new PDFGenerator();
      const blob = await generator.generateInvoicePDF(invoiceId, lineItems);

      if (download) {
        const { data: invoice } = await supabase
          .from('invoices')
          .select('invoice_number')
          .eq('id', invoiceId)
          .single();

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoice?.invoice_number}.pdf`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
          title: 'Success',
          description: 'Invoice PDF downloaded successfully',
        });

        // Log activity
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await CRUDLogger.logUpdate({
            userId: user.id,
            entityType: 'invoice',
            entityId: invoiceId,
            entityName: invoice?.invoice_number || '',
            changes: { action: { old: '', new: 'PDF downloaded' } },
          });
        }
      }

      return blob;
    } catch (error: any) {
      console.error('Error generating invoice PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate invoice PDF',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const uploadAndSaveQuotePDF = async (
    quoteId: string,
    blob: Blob,
    quoteNumber: string
  ): Promise<string | null> => {
    try {
      const path = `quotes/${quoteId}/${quoteNumber}-${Date.now()}.pdf`;
      const url = await uploadDocumentToStorage(blob, path);

      // Update quote with PDF URL
      await supabase
        .from('quotes')
        .update({ pdf_url: url })
        .eq('id', quoteId);

      return url;
    } catch (error: any) {
      console.error('Error uploading quote PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload quote PDF',
        variant: 'destructive',
      });
      return null;
    }
  };

  const uploadAndSaveInvoicePDF = async (
    invoiceId: string,
    blob: Blob,
    invoiceNumber: string
  ): Promise<string | null> => {
    try {
      const path = `invoices/${invoiceId}/${invoiceNumber}-${Date.now()}.pdf`;
      const url = await uploadDocumentToStorage(blob, path);

      // Update invoice with PDF URL
      await supabase
        .from('invoices')
        .update({ pdf_url: url })
        .eq('id', invoiceId);

      return url;
    } catch (error: any) {
      console.error('Error uploading invoice PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload invoice PDF',
        variant: 'destructive',
      });
      return null;
    }
  };

  return {
    isGenerating,
    generateQuotePDF,
    generateInvoicePDF,
    uploadAndSaveQuotePDF,
    uploadAndSaveInvoicePDF,
  };
}
