import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BulkEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  selectedContacts: Array<{ email: string; first_name: string; last_name: string }>;
  onConfirm: (subject: string, body: string, templateId?: string) => Promise<void>;
}

export function BulkEmailModal({
  open,
  onOpenChange,
  selectedCount,
  selectedContacts,
  onConfirm,
}: BulkEmailModalProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    try {
      const { data } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true);

      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
    }
  };

  const renderPreview = (text: string, contact: any) => {
    return text
      .replace(/{{contact_name}}/g, `${contact.first_name} ${contact.last_name}`)
      .replace(/{{first_name}}/g, contact.first_name)
      .replace(/{{last_name}}/g, contact.last_name)
      .replace(/{{email}}/g, contact.email);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm(subject, body, selectedTemplate || undefined);
      onOpenChange(false);
      setSubject('');
      setBody('');
      setSelectedTemplate('');
    } finally {
      setIsLoading(false);
    }
  };

  const previewContacts = selectedContacts.slice(0, 3);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Bulk Email</DialogTitle>
          <DialogDescription>
            Composing email for {selectedCount} {selectedCount === 1 ? 'contact' : 'contacts'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {templates.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="template">Email Template (Optional)</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger id="template">
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
            />
            <p className="text-xs text-muted-foreground">
              Merge fields: {'{{contact_name}}'}, {'{{first_name}}'}, {'{{last_name}}'}, {'{{email}}'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Email Body</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter email body..."
              rows={8}
            />
          </div>

          {previewContacts.length > 0 && (
            <div className="space-y-2">
              <Label>Preview (first {previewContacts.length} contacts)</Label>
              <div className="space-y-3">
                {previewContacts.map((contact, index) => (
                  <div key={index} className="bg-muted p-3 rounded text-sm">
                    <div className="font-medium mb-1">
                      To: {contact.email}
                    </div>
                    <div className="font-medium mb-1">
                      Subject: {renderPreview(subject, contact)}
                    </div>
                    <div className="text-muted-foreground whitespace-pre-wrap">
                      {renderPreview(body, contact).substring(0, 150)}
                      {renderPreview(body, contact).length > 150 && '...'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!subject || !body || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Queue {selectedCount} Email{selectedCount !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
