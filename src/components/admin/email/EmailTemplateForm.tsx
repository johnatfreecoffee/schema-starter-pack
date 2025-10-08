import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface EmailTemplateFormProps {
  template?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const commonVariables = [
  'first_name', 'last_name', 'email', 'phone',
  'company_name', 'company_email', 'company_phone', 'company_address',
  'current_date', 'current_year',
  'account_name', 'invoice_number', 'amount_due', 'due_date',
  'task_title', 'task_due_date', 'task_priority',
  'project_name', 'project_status', 'user_name'
];

const EmailTemplateForm = ({ template, onSuccess, onCancel }: EmailTemplateFormProps) => {
  const [name, setName] = useState(template?.name || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [body, setBody] = useState(template?.body || '');
  const [category, setCategory] = useState(template?.category || 'custom');
  const [selectedVariables, setSelectedVariables] = useState<string[]>(
    template?.variables || []
  );
  const queryClient = useQueryClient();

  useEffect(() => {
    if (template) {
      setName(template.name);
      setSubject(template.subject);
      setBody(template.body);
      setCategory(template.category);
      setSelectedVariables(template.variables || []);
    }
  }, [template]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();

      const templateData = {
        name,
        subject,
        body,
        category,
        variables: selectedVariables,
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      };

      if (template) {
        const { error } = await supabase
          .from('email_templates')
          .update(templateData)
          .eq('id', template.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert({
            ...templateData,
            created_by: user?.id
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success(template ? 'Template updated' : 'Template created');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save template');
    }
  });

  const insertVariable = (variable: string) => {
    const varTag = `{{${variable}}}`;
    setBody(prev => prev + varTag);
    if (!selectedVariables.includes(variable)) {
      setSelectedVariables(prev => [...prev, variable]);
    }
  };

  const insertVariableInSubject = (variable: string) => {
    const varTag = `{{${variable}}}`;
    setSubject(prev => prev + varTag);
    if (!selectedVariables.includes(variable)) {
      setSelectedVariables(prev => [...prev, variable]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Template Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Welcome Email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="transactional">Transactional</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="subject">Subject Line *</Label>
          <Select onValueChange={insertVariableInSubject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Insert variable" />
            </SelectTrigger>
            <SelectContent>
              {commonVariables.map(variable => (
                <SelectItem key={variable} value={variable}>
                  {`{{${variable}}}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Welcome to {{company_name}}"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="body">Email Body *</Label>
          <Select onValueChange={insertVariable}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Insert variable" />
            </SelectTrigger>
            <SelectContent>
              {commonVariables.map(variable => (
                <SelectItem key={variable} value={variable}>
                  {`{{${variable}}}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="<p>Hello {{first_name}},</p><p>Welcome to {{company_name}}!</p>"
          rows={10}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Use HTML tags for formatting. Variables will be replaced with actual values when sent.
        </p>
      </div>

      {selectedVariables.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Variables</Label>
          <div className="flex flex-wrap gap-2">
            {selectedVariables.map(variable => (
              <Badge key={variable} variant="secondary">
                {`{{${variable}}}`}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!name || !subject || !body || saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </div>
  );
};

export default EmailTemplateForm;
