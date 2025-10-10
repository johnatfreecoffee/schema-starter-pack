import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Save, Trash2 } from 'lucide-react';

export const SEOTemplates = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const { data: templates } = useQuery({
    queryKey: ['seo-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seo_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (template: any) => {
      if (template.id) {
        const { error } = await supabase
          .from('seo_templates')
          .update(template)
          .eq('id', template.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('seo_templates')
          .insert([template]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-templates'] });
      toast({
        title: 'Template saved',
        description: 'SEO template has been updated',
      });
      setSelectedTemplate(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('seo_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-templates'] });
      toast({
        title: 'Template deleted',
        description: 'SEO template has been removed',
      });
    },
  });

  if (selectedTemplate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedTemplate.id ? 'Edit Template' : 'New Template'}
          </CardTitle>
          <CardDescription>
            Use variables like {'{'}{'{'} service_name {'}'}{'}'},  {'{'}{'{'} city_name {'}'}{'}'},  {'{'}{'{'} company_name {'}'}{'}'} in templates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={selectedTemplate.template_name || ''}
              onChange={(e) =>
                setSelectedTemplate({
                  ...selectedTemplate,
                  template_name: e.target.value,
                })
              }
              placeholder="Service Pages Template"
            />
          </div>

          <div>
            <Label htmlFor="applies-to">Applies To</Label>
            <Input
              id="applies-to"
              value={selectedTemplate.applies_to || ''}
              onChange={(e) =>
                setSelectedTemplate({
                  ...selectedTemplate,
                  applies_to: e.target.value,
                })
              }
              placeholder="generated_pages"
            />
          </div>

          <div>
            <Label htmlFor="title-template">Meta Title Template</Label>
            <Input
              id="title-template"
              value={selectedTemplate.meta_title_template || ''}
              onChange={(e) =>
                setSelectedTemplate({
                  ...selectedTemplate,
                  meta_title_template: e.target.value,
                })
              }
              placeholder="{{service_name}} in {{city_name}} | {{company_name}}"
            />
          </div>

          <div>
            <Label htmlFor="description-template">Meta Description Template</Label>
            <Textarea
              id="description-template"
              value={selectedTemplate.meta_description_template || ''}
              onChange={(e) =>
                setSelectedTemplate({
                  ...selectedTemplate,
                  meta_description_template: e.target.value,
                })
              }
              placeholder="Professional {{service_name}} services in {{city_name}}. Contact us today for a free quote!"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="og-title-template">Open Graph Title Template</Label>
            <Input
              id="og-title-template"
              value={selectedTemplate.og_title_template || ''}
              onChange={(e) =>
                setSelectedTemplate({
                  ...selectedTemplate,
                  og_title_template: e.target.value,
                })
              }
              placeholder="{{service_name}} Services in {{city_name}}"
            />
          </div>

          <div>
            <Label htmlFor="og-description-template">
              Open Graph Description Template
            </Label>
            <Textarea
              id="og-description-template"
              value={selectedTemplate.og_description_template || ''}
              onChange={(e) =>
                setSelectedTemplate({
                  ...selectedTemplate,
                  og_description_template: e.target.value,
                })
              }
              placeholder="Get professional {{service_name}} in {{city_name}} from {{company_name}}"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => saveMutation.mutate(selectedTemplate)}
              disabled={saveMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
            <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setSelectedTemplate({})}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template: any) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.template_name}</CardTitle>
                    <Badge variant="outline" className="mt-2">
                      {template.applies_to}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <div className="font-medium text-muted-foreground">Title Template:</div>
                    <div className="text-sm">{template.meta_title_template}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">
                      Description Template:
                    </div>
                    <div className="text-sm line-clamp-2">
                      {template.meta_description_template}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTemplate(template)}
                  className="mt-4 w-full"
                >
                  Edit Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No SEO templates created yet</p>
            <Button onClick={() => setSelectedTemplate({})}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
