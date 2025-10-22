import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Send, Sparkles, Eye, Code, Save, X } from 'lucide-react';
import VariablePicker from './VariablePicker';
import Editor from '@monaco-editor/react';

interface UnifiedPageEditorProps {
  open: boolean;
  onClose: () => void;
  service?: any;
  pageType: 'service' | 'static' | 'generated';
  pageTitle: string;
  onSave: (html: string) => Promise<void>;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  suggestion?: string;
}

const UnifiedPageEditor = ({
  open,
  onClose,
  service,
  pageType,
  pageTitle,
  onSave
}: UnifiedPageEditorProps) => {
  const [templateHtml, setTemplateHtml] = useState('');
  const [originalHtml, setOriginalHtml] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [renderedPreview, setRenderedPreview] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  // Load template for service
  const { data: template, isLoading } = useQuery({
    queryKey: ['service-template', service?.id],
    queryFn: async () => {
      if (!service?.id) return null;

      const { data: serviceData } = await supabase
        .from('services')
        .select('template_id, templates(*)')
        .eq('id', service.id)
        .single();

      if (serviceData?.template_id && serviceData.templates) {
        return serviceData.templates;
      }

      // Create default template
      const defaultHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 60px 20px; border-radius: 16px; margin-bottom: 40px; }
    h1 { font-size: 3rem; margin: 0 0 1rem; }
    .lead { font-size: 1.25rem; opacity: 0.9; }
    .section { margin: 40px 0; }
    .cta { background: #667eea; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <h1>{{service_name}} in {{city_name}}</h1>
      <p class="lead">{{service_description}}</p>
    </div>
    
    <div class="section">
      <h2>About Our {{service_name}} Services</h2>
      <p>{{local_description}}</p>
    </div>
    
    <div class="section">
      <h2>Contact {{company_name}}</h2>
      <p>Call us at {{company_phone}} for {{service_name}} in {{area_display_name}}</p>
      <p>Email: {{company_email}}</p>
      <a href="#contact" class="cta">Get Started Today</a>
    </div>
  </div>
</body>
</html>`;

      const { data: newTemplate, error } = await supabase
        .from('templates')
        .insert({
          name: `${service.name} Template`,
          template_html: defaultHtml,
          template_type: 'service',
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('services')
        .update({ template_id: newTemplate.id })
        .eq('id', service.id);

      return newTemplate;
    },
    enabled: !!service?.id && open,
  });

  // Load company settings and AI training
  const { data: companySettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('company_settings').select('*').single();
      return data;
    },
    enabled: open,
  });

  const { data: aiTraining } = useQuery({
    queryKey: ['ai-training'],
    queryFn: async () => {
      const { data } = await supabase.from('ai_training').select('*').single();
      return data;
    },
    enabled: open,
  });

  // Load service areas for preview data
  const { data: serviceAreas } = useQuery({
    queryKey: ['service-areas-preview'],
    queryFn: async () => {
      const { data } = await supabase
        .from('service_areas')
        .select('*')
        .eq('status', true)
        .limit(1);
      return data;
    },
    enabled: open,
  });

  useEffect(() => {
    if (template?.template_html) {
      setTemplateHtml(template.template_html);
      setOriginalHtml(template.template_html);
    }
  }, [template]);

  // Update preview when template changes
  useEffect(() => {
    if (templateHtml && serviceAreas?.[0] && companySettings && service) {
      try {
        const previewData = {
          service_name: service.name,
          service_description: service.description || '',
          service_starting_price: service.starting_price ? `$${(service.starting_price / 100).toFixed(2)}` : 'Contact for pricing',
          city_name: serviceAreas[0].city_name,
          city_slug: serviceAreas[0].city_slug,
          display_name: serviceAreas[0].display_name || serviceAreas[0].city_name,
          area_display_name: serviceAreas[0].display_name || serviceAreas[0].city_name,
          local_description: serviceAreas[0].local_description || '',
          company_name: companySettings.business_name,
          company_phone: companySettings.phone,
          company_email: companySettings.email,
          company_address: companySettings.address,
        };

        let rendered = templateHtml;
        Object.entries(previewData).forEach(([key, value]) => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          rendered = rendered.replace(regex, String(value));
        });
        
        setRenderedPreview(rendered);
      } catch (error) {
        console.error('Preview render error:', error);
      }
    }
  }, [templateHtml, serviceAreas, companySettings, service]);

  const sendToAi = async () => {
    if (!aiPrompt.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: aiPrompt };
    setChatMessages(prev => [...prev, userMessage]);
    setIsAiLoading(true);
    const currentPrompt = aiPrompt;
    setAiPrompt('');

    try {
      const { data, error } = await supabase.functions.invoke('ai-edit-page', {
        body: {
          command: currentPrompt,
          context: {
            currentPage: {
              type: pageType,
              url: service ? `/${service.slug}` : '/',
              html: templateHtml,
            },
            companyInfo: companySettings,
            aiTraining: aiTraining,
          },
        },
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.explanation || 'I\'ve updated the page based on your request.',
        suggestion: data.updatedHtml,
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      toast({
        title: 'AI Error',
        description: error.message,
        variant: 'destructive',
      });
      setChatMessages(prev => prev.slice(0, -1));
    } finally {
      setIsAiLoading(false);
    }
  };

  const applyAiSuggestion = (suggestion: string) => {
    setTemplateHtml(suggestion);
    setHasUnsavedChanges(true);
    toast({
      title: 'Changes applied',
      description: 'Review the preview and save when ready.',
    });
  };

  const handleInsertVariable = (variable: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const text = aiPrompt;
      const newText = text.substring(0, start) + variable + text.substring(end);
      setAiPrompt(newText);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newPosition = start + variable.length;
          textareaRef.current.setSelectionRange(newPosition, newPosition);
        }
      }, 0);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!template?.id) throw new Error('No template found');

      const { error } = await supabase
        .from('templates')
        .update({ 
          template_html: templateHtml,
          updated_at: new Date().toISOString()
        })
        .eq('id', template.id);

      if (error) throw error;

      if (service) {
        await supabase
          .from('generated_pages')
          .update({ needs_regeneration: true })
          .eq('service_id', service.id);
      }

      await onSave(templateHtml);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-template', service?.id] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setHasUnsavedChanges(false);
      setOriginalHtml(templateHtml);
      toast({ title: 'Saved successfully' });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error saving',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] h-[90vh]">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>Editing: {pageTitle}</DialogTitle>
            <div className="flex gap-2">
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => saveMutation.mutate()} 
                disabled={!hasUnsavedChanges || saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" /> Save Changes</>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex h-[calc(100%-80px)]">
          {/* Left Panel - AI Chat */}
          <div className="w-2/5 border-r flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">AI Assistant</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Describe changes you want, or ask AI to build the page for you
              </p>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 pr-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm mb-2">Ask AI to modify your page</p>
                    <div className="text-xs space-y-1 max-w-xs mx-auto text-left">
                      <p>Examples:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Make the headline more urgent</li>
                        <li>Add a testimonial section</li>
                        <li>Create a pricing table</li>
                        <li>Build a beautiful hero section</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-lg ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground ml-8' 
                          : 'bg-muted mr-8'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {msg.role === 'assistant' && msg.suggestion && (
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="mt-2"
                          onClick={() => applyAiSuggestion(msg.suggestion!)}
                        >
                          Apply Changes
                        </Button>
                      )}
                    </div>
                  ))
                )}
                {isAiLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground p-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">AI is working...</span>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t space-y-2">
              <div className="flex gap-2 mb-2">
                <VariablePicker 
                  onInsert={handleInsertVariable}
                  includeServiceVars={pageType === 'service'}
                  includeServiceAreaVars={pageType === 'service'}
                />
              </div>
              <div className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  placeholder="Describe your changes or ask AI to build something..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      sendToAi();
                    }
                  }}
                  disabled={isAiLoading}
                  className="min-h-[80px] resize-none"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Cmd/Ctrl + Enter to send</span>
                <Button 
                  onClick={sendToAi} 
                  disabled={isAiLoading || !aiPrompt.trim()}
                  size="sm"
                >
                  {isAiLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <><Send className="mr-2 h-4 w-4" /> Send</>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview/Code */}
          <div className="w-3/5 flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'preview' | 'code')}>
                <TabsList>
                  <TabsTrigger value="preview">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="code">
                    <Code className="mr-2 h-4 w-4" />
                    Code
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex-1 overflow-hidden">
              {viewMode === 'preview' ? (
                <div className="w-full h-full bg-white">
                  {renderedPreview ? (
                    <iframe 
                      srcDoc={renderedPreview}
                      className="w-full h-full border-0"
                      title="Page Preview"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>Loading preview...</p>
                    </div>
                  )}
                </div>
              ) : (
                <Editor
                  height="100%"
                  defaultLanguage="html"
                  value={templateHtml}
                  onChange={(value) => {
                    setTemplateHtml(value || '');
                    setHasUnsavedChanges(true);
                  }}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: true },
                    wordWrap: 'on',
                    automaticLayout: true,
                    fontSize: 14,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedPageEditor;
