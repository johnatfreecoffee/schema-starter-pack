import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useGeneratePDF } from '@/hooks/useGeneratePDF';
import { CRUDLogger } from '@/lib/crudLogger';
import { Loader2 } from 'lucide-react';

interface EmailPDFDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: 'quote' | 'invoice';
  documentId: string;
  documentNumber: string;
  pdfBlob: Blob;
  defaultEmail?: string;
}

const EmailPDFDialog = ({
  open,
  onOpenChange,
  documentType,
  documentId,
  documentNumber,
  pdfBlob,
  defaultEmail = '',
}: EmailPDFDialogProps) => {
  const { toast } = useToast();
  const { uploadAndSaveQuotePDF, uploadAndSaveInvoicePDF } = useGeneratePDF();
  const [sending, setSending] = useState(false);
  
  const [formData, setFormData] = useState({
    to: defaultEmail,
    cc: '',
    subject: `${documentType === 'quote' ? 'Quote' : 'Invoice'} #${documentNumber}`,
    message: `Please find attached ${documentType === 'quote' ? 'quote' : 'invoice'} #${documentNumber}.\n\nPlease review and let us know if you have any questions.\n\nThank you for your business!`,
  });

  const handleSend = async () => {
    if (!formData.to) {
      toast({
        title: 'Error',
        description: 'Please enter a recipient email',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSending(true);

      // Upload PDF to storage
      const pdfUrl = documentType === 'quote'
        ? await uploadAndSaveQuotePDF(documentId, pdfBlob, documentNumber)
        : await uploadAndSaveInvoicePDF(documentId, pdfBlob, documentNumber);

      if (!pdfUrl) {
        throw new Error('Failed to upload PDF');
      }

      // Update last_sent_at timestamp
      const table = documentType === 'quote' ? 'quotes' : 'invoices';
      await supabase
        .from(table)
        .update({ last_sent_at: new Date().toISOString() })
        .eq('id', documentId);

      // Queue email (would be sent via email notification system)
      const { error: emailError } = await supabase
        .from('email_queue')
        .insert({
          to_email: formData.to,
          cc_email: formData.cc || null,
          subject: formData.subject,
          body: formData.message,
          entity_type: documentType,
          entity_id: documentId,
          status: 'pending',
        });

      if (emailError) throw emailError;

      // Log activity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await CRUDLogger.logUpdate({
          userId: user.id,
          entityType: documentType,
          entityId: documentId,
          entityName: documentNumber,
          changes: {
            action: { old: '', new: `Emailed to ${formData.to}` },
          },
        });
      }

      toast({
        title: 'Success',
        description: `${documentType === 'quote' ? 'Quote' : 'Invoice'} sent successfully`,
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send email',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Email {documentType === 'quote' ? 'Quote' : 'Invoice'} #{documentNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="to">To *</Label>
            <Input
              id="to"
              type="email"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              placeholder="customer@example.com"
            />
          </div>

          <div>
            <Label htmlFor="cc">CC</Label>
            <Input
              id="cc"
              type="email"
              value={formData.cc}
              onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
              placeholder="Optional"
            />
          </div>

          <div>
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              rows={6}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Attachment: {documentType}-{documentNumber}.pdf
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailPDFDialog;
