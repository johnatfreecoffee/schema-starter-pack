import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { EmailService } from '@/services/emailService';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SendEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  entityId: string;
  recipientEmail: string;
  recipientName: string;
}

export const SendEmailModal = ({
  open,
  onOpenChange,
  entityType,
  entityId,
  recipientEmail,
  recipientName
}: SendEmailModalProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState<{ subject: string; body: string } | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['email-templates', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (selectedTemplate) {
      generatePreview();
    }
  }, [selectedTemplate]);

  const generatePreview = async () => {
    if (!selectedTemplate) return;

    try {
      // Fetch entity data to populate variables
      let entityData: any = {};
      
      if (entityType === 'contact' || entityType === 'lead') {
        const { data } = await supabase
          .from(entityType === 'contact' ? 'contacts' : 'leads')
          .select('*')
          .eq('id', entityId)
          .single();
        entityData = data;
      } else if (entityType === 'account') {
        const { data } = await supabase
          .from('accounts')
          .select('*')
          .eq('id', entityId)
          .single();
        entityData = data;
      }

      const variables = {
        first_name: entityData?.first_name || recipientName.split(' ')[0] || '',
        last_name: entityData?.last_name || recipientName.split(' ').slice(1).join(' ') || '',
        email: recipientEmail,
        account_name: entityData?.account_name || recipientName,
        phone: entityData?.phone || '',
      };

      const previewData = await EmailService.previewTemplate(selectedTemplate, variables);
      setPreview(previewData);
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  };

  const handleSend = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }

    setSending(true);
    try {
      // Fetch entity data for variables
      let entityData: any = {};
      
      if (entityType === 'contact' || entityType === 'lead') {
        const { data } = await supabase
          .from(entityType === 'contact' ? 'contacts' : 'leads')
          .select('*')
          .eq('id', entityId)
          .single();
        entityData = data;
      } else if (entityType === 'account') {
        const { data } = await supabase
          .from('accounts')
          .select('*')
          .eq('id', entityId)
          .single();
        entityData = data;
      }

      const variables = {
        first_name: entityData?.first_name || recipientName.split(' ')[0] || '',
        last_name: entityData?.last_name || recipientName.split(' ').slice(1).join(' ') || '',
        email: recipientEmail,
        account_name: entityData?.account_name || recipientName,
        phone: entityData?.phone || '',
      };

      const result = await EmailService.sendTemplateEmail(
        selectedTemplate,
        recipientEmail,
        variables,
        {
          entityType,
          entityId
        }
      );

      if (result.success) {
        toast.success('Email sent successfully');
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Failed to send email');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Email to {recipientName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Email Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Loading templates...
                  </div>
                ) : templates?.length === 0 ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    No templates available
                  </div>
                ) : (
                  templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {preview && (
            <Card className="p-4 space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Subject Preview</Label>
                <p className="font-medium">{preview.subject}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Body Preview</Label>
                <div 
                  className="prose prose-sm max-w-none border rounded p-3 max-h-60 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: preview.body }}
                />
              </div>
            </Card>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={!selectedTemplate || sending}>
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};