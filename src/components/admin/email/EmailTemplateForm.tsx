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
import { Sparkles, Code, Eye, Edit3, Undo2 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Switch } from '@/components/ui/switch';

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
  const [activeTab, setActiveTab] = useState<'form' | 'ai' | 'editor'>('form');
  const [editorMode, setEditorMode] = useState<'code' | 'visual'>('visual');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previousBody, setPreviousBody] = useState<string>('');
  const [canRevert, setCanRevert] = useState(false);
  const queryClient = useQueryClient();

  const richEditor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: body,
    onUpdate: ({ editor }) => {
      setBody(editor.getHTML());
    },
  });

  useEffect(() => {
    if (template) {
      setName(template.name);
      setSubject(template.subject);
      setBody(template.body);
      setCategory(template.category);
      setSelectedVariables(template.variables || []);
    }
  }, [template]);

  useEffect(() => {
    if (richEditor && richEditor.getHTML() !== body) {
      richEditor.commands.setContent(body);
    }
  }, [body, richEditor]);

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
      // Save current state for revert
      setPreviousBody(body);
      
      const { data, error } = await supabase.functions.invoke('generate-email-template', {
        body: { prompt: aiPrompt }
      });

      if (error) throw error;

      if (data?.name) setName(data.name);
      if (data?.subject) setSubject(data.subject);
      if (data?.body) {
        setBody(data.body);
        if (richEditor) {
          richEditor.commands.setContent(data.body);
        }
      }
      if (data?.category) setCategory(data.category);
      
      setCanRevert(true);
      toast.success('Template generated! Switch to Editor to refine it.');
      setActiveTab('editor');
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast.error(error.message || 'Failed to generate template');
    } finally {
      setIsGenerating(false);
    }
  };

  const revertAIGeneration = () => {
    setBody(previousBody);
    if (richEditor) {
      richEditor.commands.setContent(previousBody);
    }
    setCanRevert(false);
    toast.success('Reverted to previous version');
  };

  const insertVariableInEditor = (variable: string) => {
    const varTag = `{{${variable}}}`;
    if (editorMode === 'visual' && richEditor) {
      richEditor.commands.insertContent(varTag);
    } else {
      setBody(prev => prev + varTag);
    }
    if (!selectedVariables.includes(variable)) {
      setSelectedVariables(prev => [...prev, variable]);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="form" className="flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            Form
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Generate
          </TabsTrigger>
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Editor
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
            {canRevert && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <span className="text-sm text-muted-foreground">AI generation applied</span>
                <Button variant="outline" size="sm" onClick={revertAIGeneration}>
                  <Undo2 className="h-4 w-4 mr-2" />
                  Revert to Previous
                </Button>
              </div>
            )}
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
              AI will generate and replace the current template content. You can revert if needed.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="editor" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Label className="text-sm">View Mode:</Label>
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                <Switch 
                  checked={editorMode === 'visual'} 
                  onCheckedChange={(checked) => setEditorMode(checked ? 'visual' : 'code')}
                />
                <Eye className="h-4 w-4" />
              </div>
              <span className="text-sm text-muted-foreground">
                {editorMode === 'visual' ? 'Rich Editor' : 'Code Editor'}
              </span>
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
          </div>

          {editorMode === 'code' ? (
            <div className="space-y-2">
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
                Edit HTML directly with syntax highlighting
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="border rounded-md p-4 min-h-[400px] prose prose-sm max-w-none">
                <EditorContent editor={richEditor} />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => richEditor?.chain().focus().toggleBold().run()}
                >
                  Bold
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => richEditor?.chain().focus().toggleItalic().run()}
                >
                  Italic
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => richEditor?.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                  Heading
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => richEditor?.chain().focus().toggleBulletList().run()}
                >
                  List
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use the rich editor to format your email visually
              </p>
            </div>
          )}
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
