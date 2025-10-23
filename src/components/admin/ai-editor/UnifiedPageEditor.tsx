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
import TruncatedMessage from './TruncatedMessage';

interface UnifiedPageEditorProps {
  open: boolean;
  onClose: () => void;
  service?: any;
  pageType: 'service' | 'static' | 'generated';
  pageTitle: string;
  onSave: (html: string) => Promise<void>;
  initialHtml?: string; // For static pages
  pageId?: string; // For static pages
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
  onSave,
  initialHtml,
  pageId
}: UnifiedPageEditorProps) => {
  const [templateHtml, setTemplateHtml] = useState('');
  const [originalHtml, setOriginalHtml] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [renderedPreview, setRenderedPreview] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load template for service or static page
  const { data: template, isLoading } = useQuery({
    queryKey: ['service-template', service?.id, 'static-page', pageId],
    queryFn: async () => {
      // For static pages, return initial HTML directly
      if (pageType === 'static' && initialHtml) {
        return {
          id: pageId || 'static',
          template_html: initialHtml,
          name: pageTitle,
          template_type: 'static'
        };
      }

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
    enabled: (!!service?.id || (pageType === 'static' && !!initialHtml)) && open,
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
            serviceInfo: service ? {
              name: service.name,
              slug: service.slug,
              description: service.description || service.full_description || '',
              category: service.category,
              starting_price: service.starting_price,
              is_active: service.is_active,
            } : null,
            companyInfo: companySettings,
            aiTraining: aiTraining,
          },
        },
      });

      if (error) throw error;

      // Auto-apply changes immediately
      if (data.updatedHtml) {
        setTemplateHtml(data.updatedHtml);
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.explanation || 'I\'ve updated the page based on your request.',
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
    toast({
      title: 'Changes applied',
      description: 'Changes will be saved automatically.',
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

  // Auto-save function
  const autoSave = async () => {
    if (!template?.id || templateHtml === originalHtml) return;

    setIsSaving(true);
    try {
      // For static pages, save directly to static_pages table
      if (pageType === 'static' && pageId) {
        const { error } = await supabase
          .from('static_pages')
          .update({ 
            content_html: templateHtml,
            updated_at: new Date().toISOString()
          })
          .eq('id', pageId);

        if (error) throw error;
      } else {
        // For service templates, save to templates table
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
      }

      setOriginalHtml(templateHtml);
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ['service-template', service?.id, 'static-page', pageId, 'static-pages'] });
    } catch (error: any) {
      console.error('Auto-save error:', error);
      toast({
        title: 'Auto-save failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Debounced auto-save effect
  useEffect(() => {
    if (templateHtml !== originalHtml) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout for auto-save (2 seconds after user stops typing)
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSave();
      }, 2000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [templateHtml, originalHtml]);

  // Auto-scroll chat to bottom when messages change or AI state updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatMessages, isAiLoading]);

  const closeMutation = useMutation({
    mutationFn: async () => {
      await onSave(templateHtml);
    },
    onSuccess: () => {
      onClose();
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
          <div className="flex items-center gap-3">
            <DialogTitle>Editing: {pageTitle}</DialogTitle>
            <div className="text-xs text-muted-foreground">
              {isSaving ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </span>
              ) : lastSaved ? (
                <span>Saved {new Date(lastSaved).toLocaleTimeString()}</span>
              ) : templateHtml !== originalHtml ? (
                <span>Unsaved changes</span>
              ) : (
                <span>All changes saved</span>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex h-[calc(100%-80px)]">
          {/* Left Panel - AI Chat */}
          <div className="w-2/5 border-r flex flex-col overflow-hidden">
            <div className="p-4 border-b flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">AI Assistant</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Describe changes you want, or ask AI to build the page for you
              </p>
            </div>

            <ScrollArea className="flex-1 overflow-auto">
              <div className="space-y-4 p-4 pb-4">
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
                      className={`p-3 rounded-lg max-w-full ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground ml-8' 
                          : 'bg-muted mr-8'
                      }`}
                    >
                      <TruncatedMessage 
                        content={msg.content}
                        className={msg.role === 'user' ? 'text-primary-foreground' : ''}
                      />
                    </div>
                  ))
                )}
                {isAiLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground p-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">AI is working...</span>
                  </div>
                )}
                <div ref={chatEndRef} className="h-1" />
              </div>
            </ScrollArea>

            <div className="p-4 border-t space-y-2 flex-shrink-0 bg-background">
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

            <div className="flex-1 overflow-hidden h-full">
              {viewMode === 'preview' ? (
                <div className="w-full h-full bg-white overflow-auto">
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
