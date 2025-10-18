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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Code, Eye, Edit3 } from 'lucide-react';
import Editor from '@monaco-editor/react';

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
  const [activeTab, setActiveTab] = useState<'form' | 'ai' | 'code' | 'preview'>('form');
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
      
      toast.success('Template generated! Review and edit as needed.');
      setActiveTab('form');
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast.error(error.message || 'Failed to generate template');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="form" className="flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            Form
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Generate
          </TabsTrigger>
          <TabsTrigger value="code" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            HTML Code
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-4 mt-4">
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
        </TabsContent>

        <TabsContent value="ai" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-prompt">Describe Your Email Template</Label>
              <Textarea
                id="ai-prompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="E.g., Create a welcome email for new customers that thanks them for signing up, includes their account details, and has a call-to-action button to get started..."
                rows={8}
                className="resize-none"
              />
            </div>
            <Button 
              onClick={generateWithAI} 
              disabled={isGenerating || !aiPrompt.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>Generating...</>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Template with AI
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground">
              AI will generate a professional email template based on your description. You can then switch to Form or Code view to make adjustments.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="code" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>HTML Code</Label>
            <div className="border rounded-md overflow-hidden">
              <Editor
                height="400px"
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
            <p className="text-xs text-muted-foreground">
              Edit HTML directly with syntax highlighting. Available variables: {commonVariables.map(v => `{{${v}}}`).join(', ')}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject Preview</Label>
              <div className="p-3 bg-muted rounded-md text-sm font-medium">
                {subject || 'No subject line yet...'}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email Body Preview</Label>
              <div 
                className="p-4 bg-background border rounded-md min-h-[300px]"
                dangerouslySetInnerHTML={{ 
                  __html: body.replace(/\{\{(\w+)\}\}/g, '<span class="bg-primary/20 px-1 rounded">$1</span>') || '<p class="text-muted-foreground">No content yet...</p>'
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This preview shows how your email will look. Variables are highlighted and will be replaced with actual data when sent.
            </p>
          </div>
        </TabsContent>
      </Tabs>

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
