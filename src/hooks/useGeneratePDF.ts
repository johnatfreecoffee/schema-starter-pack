import { useState } from 'react';
import { PDFGenerator, uploadDocumentToStorage } from '@/lib/pdfGenerator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CRUDLogger } from '@/lib/crudLogger';
import { format } from 'date-fns';

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

function sanitizeFilename(text: string, maxLength: number = 30): string {
  return text
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, maxLength);
}

export function useGeneratePDF() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateQuotePDF = async (
    quoteId: string,
    lineItems: LineItem[],
    download: boolean = false
  ): Promise<Blob | null> => {
    // Validation
    if (!lineItems || lineItems.length === 0) {
      toast({
        title: 'Cannot Generate PDF',
        description: 'No items in quote',
        variant: 'destructive',
      });
      return null;
    }

    try {
      setIsGenerating(true);
      const generator = new PDFGenerator();
      const blob = await generator.generateQuotePDF(quoteId, lineItems);

      if (download) {
        const { data: quote } = await supabase
          .from('quotes')
          .select('quote_number, accounts(account_name)')
          .eq('id', quoteId)
          .single();

        const customerName = sanitizeFilename(quote?.accounts?.account_name || 'Customer');
        const dateStr = format(new Date(), 'yyyy-MM-dd');
        const filename = `Quote_${quote?.quote_number}_${customerName}_${dateStr}.pdf`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
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
        description: error.message || 'Failed to generate quote PDF',
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
    // Validation
    if (!lineItems || lineItems.length === 0) {
      toast({
        title: 'Cannot Generate PDF',
        description: 'No items in invoice',
        variant: 'destructive',
      });
      return null;
    }

    try {
      setIsGenerating(true);
      const generator = new PDFGenerator();
      const blob = await generator.generateInvoicePDF(invoiceId, lineItems);

      if (download) {
        const { data: invoice } = await supabase
          .from('invoices')
          .select('invoice_number, accounts(account_name)')
          .eq('id', invoiceId)
          .single();

        const customerName = sanitizeFilename(invoice?.accounts?.account_name || 'Customer');
        const dateStr = format(new Date(), 'yyyy-MM-dd');
        const filename = `Invoice_${invoice?.invoice_number}_${customerName}_${dateStr}.pdf`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
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
        description: error.message || 'Failed to generate invoice PDF',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateProjectReportPDF = async (
    projectId: string,
    download: boolean = false
  ): Promise<Blob | null> => {
    try {
      setIsGenerating(true);
      const generator = new PDFGenerator();
      const blob = await generator.generateProjectReportPDF(projectId);

      if (download) {
        const { data: project } = await supabase
          .from('projects')
          .select('project_name')
          .eq('id', projectId)
          .single();

        const projectName = sanitizeFilename(project?.project_name || 'Project');
        const dateStr = format(new Date(), 'yyyy-MM-dd');
        const filename = `Project_Report_${projectName}_${dateStr}.pdf`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        toast({
          title: 'Success',
          description: 'Project report downloaded successfully',
        });

        // Log activity
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await CRUDLogger.logUpdate({
            userId: user.id,
            entityType: 'project',
            entityId: projectId,
            entityName: project?.project_name || '',
            changes: { action: { old: '', new: 'Report generated' } },
          });
        }
      }

      return blob;
    } catch (error: any) {
      console.error('Error generating project report:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate project report',
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
    generateProjectReportPDF,
    uploadAndSaveQuotePDF,
    uploadAndSaveInvoicePDF,
  };
}
