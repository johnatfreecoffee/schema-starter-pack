import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/utils/callEdgeFunction';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Loader2, Sparkles, RotateCcw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import TemplateEditor from '../templates/TemplateEditor';
import VariableReference from '../templates/VariableReference';
import { renderTemplate } from '@/lib/templateEngine';

interface ServiceTemplateEditorProps {
  service: any;
  onClose: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  suggestion?: string;
}

const ServiceTemplateEditor = ({ service, onClose }: ServiceTemplateEditorProps) => {
  const [templateHtml, setTemplateHtml] = useState('');
  const [originalHtml, setOriginalHtml] = useState('');
  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [previewCity, setPreviewCity] = useState<string>('');
  const [renderedPreview, setRenderedPreview] = useState('');
  const queryClient = useQueryClient();

  // Fetch or create template for this service
  const { data: template, isLoading } = useQuery({
    queryKey: ['service-template', service?.id],
    queryFn: async () => {
      if (!service?.id) return null;

      // Check if service has a template
      const { data: serviceData } = await supabase
        .from('services')
        .select('template_id, templates(*)')
        .eq('id', service.id)
        .single();

      if (serviceData?.template_id && serviceData.templates) {
        return serviceData.templates;
      }

      // Create default template if none exists
      const defaultHtml = `<div class="service-page">
  <h1>{{service_name}} in {{city_name}}</h1>
  <p class="lead">{{service_description}}</p>
  
  <section class="service-details">
    <h2>About Our {{service_name}} Services</h2>
    <p>{{local_description}}</p>
  </section>
  
  <section class="contact">
    <h2>Contact Us</h2>
    <p>Call {{company_phone}} for {{service_name}} in {{area_display_name}}</p>
    <p>Email: {{company_email}}</p>
  </section>
</div>`;

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

      // Link template to service
      await supabase
        .from('services')
        .update({ template_id: newTemplate.id })
        .eq('id', service.id);

      return newTemplate;
    },
    enabled: !!service?.id,
  });

  // Load service areas for preview
  const { data: serviceAreas } = useQuery({
    queryKey: ['service-areas-preview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_areas')
        .select('*')
        .eq('status', true)
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  // Load company settings for preview
  const { data: companySettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Load AI training data for context
  const { data: aiTraining } = useQuery({
    queryKey: ['ai-training'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_training')
        .select('*')
        .single();
      if (error) return null;
      return data;
    },
  });

  useEffect(() => {
    if (template?.template_html) {
      setTemplateHtml(template.template_html);
      setOriginalHtml(template.template_html);
    }
  }, [template]);

  useEffect(() => {
    if (serviceAreas && serviceAreas.length > 0 && !previewCity) {
      setPreviewCity(serviceAreas[0].id);
    }
  }, [serviceAreas, previewCity]);

  // Extract variables from template HTML
  useEffect(() => {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = templateHtml.matchAll(regex);
    const variables = Array.from(matches, m => m[1].trim());
    const uniqueVariables = [...new Set(variables)];
    setDetectedVariables(uniqueVariables);
  }, [templateHtml]);

  // Update preview when template or city changes
  useEffect(() => {
    if (templateHtml && previewCity && serviceAreas && companySettings) {
      const selectedArea = serviceAreas.find(a => a.id === previewCity);
      if (selectedArea) {
        try {
          const previewData = {
            service_name: service.name,
            service_description: service.description || '',
            service_starting_price: service.starting_price ? `$${(service.starting_price / 100).toFixed(2)}` : 'Contact for pricing',
            city_name: selectedArea.city_name,
            city_slug: selectedArea.city_slug,
            display_name: selectedArea.display_name || selectedArea.city_name,
            area_display_name: selectedArea.display_name || selectedArea.city_name,
            local_description: selectedArea.local_description || '',
            company_name: companySettings.business_name,
            company_phone: companySettings.phone,
            company_email: companySettings.email,
            company_address: companySettings.address,
          };
          const rendered = renderTemplate(templateHtml, previewData);
          setRenderedPreview(rendered);
        } catch (error) {
          console.error('Preview render error:', error);
          setRenderedPreview('<div style="padding: 20px; color: red;">Error rendering preview. Check template syntax.</div>');
        }
      }
    }
  }, [templateHtml, previewCity, serviceAreas, service, companySettings]);

  const sendToAi = async () => {
    if (!aiPrompt.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: aiPrompt,
    };
    setChatMessages(prev => [...prev, userMessage]);
    setIsAiLoading(true);
    setAiPrompt('');

    try {
      const data = await callEdgeFunction<{ updatedHtml?: string; explanation?: string }>({
        name: 'ai-edit-page',
        body: {
          command: {
            text: aiPrompt,
            model: 'makecom', // Always use Make.com
          },
          context: {
            currentPage: {
              type: 'service',
              url: `/${service.slug}`,
              html: templateHtml,
            },
            companyInfo: companySettings,
            aiTraining: aiTraining,
          },
        },
        timeoutMs: 180000,
      });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: (data as any).explanation || 'I\'ve updated the template based on your request.',
        suggestion: (data as any).updatedHtml,
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      toast({
        title: 'AI Error',
        description: error.message,
        variant: 'destructive',
      });
      setChatMessages(prev => prev.slice(0, -1)); // Remove user message on error
    } finally {
      setIsAiLoading(false);
    }
  };

  const applyAiSuggestion = (suggestion: string) => {
    setTemplateHtml(suggestion);
    toast({
      title: 'Applied AI suggestion',
      description: 'The template has been updated. Review and save when ready.',
    });
  };

  const handleRevert = () => {
    setTemplateHtml(originalHtml);
    toast({
      title: 'Template reverted',
      description: 'Changes have been discarded.',
    });
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

      // Get all pages for this service to regenerate
      const { data: pages } = await supabase
        .from('generated_pages')
        .select('id')
        .eq('service_id', service.id);

      // Mark all pages for regeneration
      if (pages && pages.length > 0) {
        await supabase
          .from('generated_pages')
          .update({ needs_regeneration: true })
          .eq('service_id', service.id);
      }

      return pages?.length || 0;
    },
    onSuccess: (pageCount) => {
      queryClient.invalidateQueries({ queryKey: ['service-template', service.id] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['generated-pages'] });
      setOriginalHtml(templateHtml);
      toast({ 
        title: 'Template saved',
        description: `Regenerating ${pageCount} pages with the new template...`
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error saving template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return <div className="p-4">Loading template...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[70vh]">
      {/* Left Panel - Code Editor (60%) */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Template Editor</h3>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRevert}
              disabled={templateHtml === originalHtml}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Revert
            </Button>
            <Button 
              size="sm" 
              onClick={() => saveMutation.mutate()} 
              disabled={saveMutation.isPending || templateHtml === originalHtml}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Template'
              )}
            </Button>
          </div>
        </div>

        <details className="border rounded-lg">
          <summary className="px-4 py-2 cursor-pointer hover:bg-muted font-medium">
            📋 Available Variables (click to expand)
          </summary>
          <div className="p-4 border-t">
            <VariableReference templateType="service" />
          </div>
        </details>
        
        <div className="flex-1 min-h-0">
          <TemplateEditor
            value={templateHtml}
            onChange={setTemplateHtml}
          />
        </div>
        
        {detectedVariables.length > 0 && (
          <Card className="p-3">
            <h4 className="font-semibold text-sm mb-2">Detected Variables:</h4>
            <div className="flex flex-wrap gap-2">
              {detectedVariables.map((variable) => (
                <code key={variable} className="px-2 py-1 bg-muted rounded text-xs">
                  {`{{${variable}}}`}
                </code>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Right Panel - AI & Preview (40%) */}
      <div className="lg:col-span-1 flex flex-col">
        <Tabs defaultValue="ai" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ai" className="flex-1 flex flex-col mt-2">
            <Card className="flex-1 flex flex-col p-4">
              <ScrollArea className="flex-1 mb-4">
                <div className="space-y-4 pr-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">Ask AI to modify your template</p>
                      <p className="text-xs mt-2">Examples:</p>
                      <ul className="text-xs mt-2 space-y-1 text-left max-w-xs mx-auto">
                        <li>• Add a testimonial section</li>
                        <li>• Make the header more prominent</li>
                        <li>• Add a call-to-action button</li>
                      </ul>
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
                        <p className="text-sm">{msg.content}</p>
                        {msg.role === 'assistant' && msg.suggestion && (
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="mt-2"
                            onClick={() => applyAiSuggestion(msg.suggestion!)}
                          >
                            Apply This Change
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                  {isAiLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground p-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="flex gap-2">
                <Input 
                  placeholder="Ask AI to modify the template..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendToAi();
                    }
                  }}
                  disabled={isAiLoading}
                />
                <Button 
                  onClick={sendToAi} 
                  disabled={isAiLoading || !aiPrompt.trim()}
                  size="icon"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="preview" className="flex-1 flex flex-col mt-2">
            <Card className="flex-1 flex flex-col p-4">
              <div className="mb-4">
                <Select value={previewCity} onValueChange={setPreviewCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select preview city" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceAreas?.map(area => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.city_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1 border rounded-lg overflow-auto bg-white">
                {renderedPreview ? (
                  <iframe 
                    srcDoc={renderedPreview}
                    className="w-full h-full"
                    title="Template Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p className="text-sm">Loading preview...</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ServiceTemplateEditor;
