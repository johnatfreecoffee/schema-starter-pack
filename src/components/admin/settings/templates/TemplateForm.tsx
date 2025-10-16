import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cacheInvalidation } from '@/lib/cacheInvalidation';
import TemplateEditor from './TemplateEditor';
import VariableReference from './VariableReference';

interface TemplateFormProps {
  template?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const TemplateForm = ({ template, onSuccess, onCancel }: TemplateFormProps) => {
  const [name, setName] = useState(template?.name || '');
  const [templateType, setTemplateType] = useState(template?.template_type || 'service');
  const [description, setDescription] = useState(template?.description || '');
  const [templateHtml, setTemplateHtml] = useState(template?.template_html || '');
  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);
  const { toast } = useToast();

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
      // Validate HTML syntax
      const parser = new DOMParser();
      const doc = parser.parseFromString(templateHtml, 'text/html');
      const parseErrors = doc.querySelector('parsererror');
      if (parseErrors) {
        throw new Error('Invalid HTML: Please check your template syntax');
      }

      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      const data = {
        name,
        template_type: templateType,
        description,
        template_html: templateHtml,
        created_by: user.data.user.id,
      };

      if (template) {
        // Update existing template
        const { error } = await supabase
          .from('templates')
          .update(data)
          .eq('id', template.id);
        if (error) throw error;

        // Mark all pages using this template for regeneration
        const { data: servicesUsingTemplate } = await supabase
          .from('services')
          .select('id')
          .eq('template_id', template.id);

        if (servicesUsingTemplate && servicesUsingTemplate.length > 0) {
          const serviceIds = servicesUsingTemplate.map(s => s.id);
          await supabase
            .from('generated_pages')
            .update({ needs_regeneration: true })
            .in('service_id', serviceIds);
          
          console.log(`Marked pages for ${serviceIds.length} services for regeneration`);
        }
      } else {
        // Create new template
        const { error } = await supabase
          .from('templates')
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      await cacheInvalidation.invalidateTemplate(template?.id);
      toast({
        title: 'Success',
        description: template ? 'Template updated successfully' : 'Template created successfully',
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold mb-4">
          {template ? 'Edit Template' : 'Create New Template'}
        </h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Service Page Template - Professional"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="type">Template Type</Label>
            <Select value={templateType} onValueChange={setTemplateType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="service">Service Template</SelectItem>
                <SelectItem value="static">Static Template</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this template is for..."
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 p-6 overflow-auto">
          <Label>Template HTML</Label>
          <div className="mt-2">
            <TemplateEditor
              value={templateHtml}
              onChange={setTemplateHtml}
            />
          </div>
        </div>

        <div className="w-80 border-l p-6 overflow-auto bg-muted/30">
          {detectedVariables.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-sm mb-2">Detected Variables</h3>
              <div className="flex flex-wrap gap-1">
                {detectedVariables.map((variable) => (
                  <span
                    key={variable}
                    className="inline-flex items-center px-2 py-1 text-xs font-mono bg-blue-100 text-blue-700 rounded"
                  >
                    {`{{${variable}}}`}
                  </span>
                ))}
              </div>
            </div>
          )}
          <VariableReference templateType={templateType} />
        </div>
      </div>

      <div className="p-6 border-t flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!name || !templateHtml || saveMutation.isPending}
        >
          {template ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </div>
  );
};

export default TemplateForm;
