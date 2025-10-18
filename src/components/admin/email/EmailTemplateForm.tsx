import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Code, Eye } from 'lucide-react';
import Editor from '@monaco-editor/react';
import GrapesEditor from './GrapesEditor';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

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
  const [triggerType, setTriggerType] = useState(template?.trigger_type || 'manual');
  const [selectedVariables, setSelectedVariables] = useState<string[]>(
    template?.variables || []
  );
  const [editorMode, setEditorMode] = useState<'code' | 'visual'>('visual');
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
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
        trigger_type: triggerType,
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
    setSubject(prev => prev + varTag);
    if (!selectedVariables.includes(variable)) {
      setSelectedVariables(prev => [...prev, variable]);
    }
  };

  const insertVariableInEditor = (variable: string) => {
    const varTag = `{{${variable}}}`;
    setBody(prev => prev + ' ' + varTag);
    if (!selectedVariables.includes(variable)) {
      setSelectedVariables(prev => [...prev, variable]);
    }
  };

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please describe the email template you want to create');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-email-template', {
        body: { prompt: aiPrompt }
      });

      if (error) throw error;

      if (data?.name) setName(data.name);
      if (data?.subject) setSubject(data.subject);
      if (data?.body) setBody(data.body);
      if (data?.category) setCategory(data.category);
      
      toast.success('Template generated successfully!');
      setShowAIDialog(false);
      setAiPrompt('');
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast.error(error.message || 'Failed to generate template');
    } finally {
      setIsGenerating(false);
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
        <Label htmlFor="trigger">Trigger Type *</Label>
        <Select value={triggerType} onValueChange={setTriggerType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual (No automatic trigger)</SelectItem>
            <SelectItem value="lead_created">Lead Created</SelectItem>
            <SelectItem value="lead_status_changed">Lead Status Changed</SelectItem>
            <SelectItem value="appointment_scheduled">Appointment Scheduled</SelectItem>
            <SelectItem value="appointment_reminder">Appointment Reminder (24h before)</SelectItem>
            <SelectItem value="quote_sent">Quote Sent</SelectItem>
            <SelectItem value="quote_accepted">Quote Accepted</SelectItem>
            <SelectItem value="invoice_sent">Invoice Sent</SelectItem>
            <SelectItem value="invoice_overdue">Invoice Overdue</SelectItem>
            <SelectItem value="project_status_changed">Project Status Changed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="subject">Subject Line *</Label>
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
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Welcome to {{company_name}}"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Email Body *</Label>
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAIDialog(true)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Generate
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {editorMode === 'visual' ? 'Visual' : 'Code'}
              </span>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <Switch 
                  checked={editorMode === 'code'} 
                  onCheckedChange={(checked) => setEditorMode(checked ? 'code' : 'visual')}
                />
                <Code className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        <Select onValueChange={insertVariableInEditor}>
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

        {editorMode === 'code' ? (
          <div className="border rounded-md overflow-hidden">
            <Editor
              height="500px"
              defaultLanguage="html"
              value={body}
              onChange={(value) => setBody(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
              }}
            />
          </div>
        ) : (
          <GrapesEditor value={body} onChange={setBody} />
        )}
        
        <p className="text-xs text-muted-foreground">
          {editorMode === 'code' 
            ? 'Edit HTML directly with syntax highlighting' 
            : 'Drag and drop components, style with visual CSS tools, and build professional email templates'}
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

      {/* AI Generation Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate Email Template with AI
            </DialogTitle>
            <DialogDescription>
              Describe the email template you want to create and AI will generate professional HTML code for you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-prompt">Describe Your Template</Label>
              <Textarea
                id="ai-prompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="E.g., Create a welcome email for new customers that thanks them for signing up, includes their account details, and has a call-to-action button to get started. Use a professional blue and white color scheme."
                rows={6}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAIDialog(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button 
                onClick={generateWithAI}
                disabled={isGenerating || !aiPrompt.trim()}
              >
                {isGenerating ? (
                  <>Generating...</>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Template
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailTemplateForm;
