import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TemplateEditor from '../templates/TemplateEditor';
import VariableReference from '../templates/VariableReference';

interface ServiceTemplateEditorProps {
  service: any;
  onClose: () => void;
}

const ServiceTemplateEditor = ({ service, onClose }: ServiceTemplateEditorProps) => {
  const [templateHtml, setTemplateHtml] = useState('');
  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);
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

  useEffect(() => {
    if (template?.template_html) {
      setTemplateHtml(template.template_html);
    }
  }, [template]);

  // Extract variables from template HTML
  useEffect(() => {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = templateHtml.matchAll(regex);
    const variables = Array.from(matches, m => m[1].trim());
    const uniqueVariables = [...new Set(variables)];
    setDetectedVariables(uniqueVariables);
  }, [templateHtml]);

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

      // Mark all generated pages for this service as needing regeneration
      await supabase
        .from('generated_pages')
        .update({ needs_regeneration: true })
        .eq('service_id', service.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-template', service.id] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({ 
        title: 'Template saved',
        description: 'All pages will be regenerated with the new template'
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
    <div className="space-y-4">
      <Tabs defaultValue="editor">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="editor">Template Editor</TabsTrigger>
          <TabsTrigger value="variables">Available Variables</TabsTrigger>
        </TabsList>
        
        <TabsContent value="editor" className="space-y-4">
          <TemplateEditor
            value={templateHtml}
            onChange={setTemplateHtml}
          />
          
          {detectedVariables.length > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Detected Variables:</h4>
              <div className="flex flex-wrap gap-2">
                {detectedVariables.map((variable) => (
                  <code key={variable} className="px-2 py-1 bg-background rounded text-sm">
                    {`{{${variable}}}`}
                  </code>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="variables">
          <VariableReference templateType="service" />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving...' : 'Save Template'}
        </Button>
      </div>
    </div>
  );
};

export default ServiceTemplateEditor;
