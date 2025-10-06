import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface ServicePreviewProps {
  service: any;
}

export default function ServicePreview({ service }: ServicePreviewProps) {
  const { data: template } = useQuery({
    queryKey: ['template', service?.template_id],
    queryFn: async () => {
      if (!service?.template_id) return null;
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', service.template_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!service?.template_id,
  });

  const { data: companySettings } = useQuery({
    queryKey: ['company-settings-preview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (!service || !template) {
    return <div className="p-4">Loading preview...</div>;
  }

  const variables = [
    { name: '{{service_name}}', value: service.name },
    { name: '{{service_description}}', value: service.full_description },
    { name: '{{starting_price}}', value: service.starting_price ? `$${(service.starting_price / 100).toFixed(2)}` : 'Contact for pricing' },
    { name: '{{city_name}}', value: 'New Orleans (example)' },
    { name: '{{city_slug}}', value: 'new-orleans' },
    { name: '{{company_name}}', value: companySettings?.business_name || 'Our Company' },
    { name: '{{company_phone}}', value: companySettings?.phone || '(555) 555-5555' },
    { name: '{{company_email}}', value: companySettings?.email || 'info@example.com' },
  ];

  const highlightVariables = (html: string) => {
    let highlighted = html;
    variables.forEach(({ name }) => {
      const regex = new RegExp(name.replace(/[{}]/g, '\\$&'), 'g');
      highlighted = highlighted.replace(
        regex,
        `<span class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded font-semibold">${name}</span>`
      );
    });
    return highlighted;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Service Preview: {service.name}</h2>
        <p className="text-muted-foreground mb-4">
          Template: {template.name} ({template.template_type})
        </p>
      </div>

      <div className="border rounded-lg p-4 bg-muted/50">
        <h3 className="font-semibold mb-3">Template Variables</h3>
        <div className="grid grid-cols-2 gap-3">
          {variables.map(({ name, value }) => (
            <div key={name} className="flex items-start gap-2 text-sm">
              <Badge variant="secondary" className="shrink-0">
                {name}
              </Badge>
              <span className="text-muted-foreground">→ {value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted px-4 py-2 font-semibold">Template HTML Preview</div>
        <div
          className="p-6 bg-background max-h-96 overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: highlightVariables(template.template_html || '') }}
        />
      </div>

      <div className="text-sm text-muted-foreground">
        <p>
          <strong>Note:</strong> Variables highlighted in yellow will be replaced with actual values
          when pages are generated for each service area.
        </p>
      </div>
    </div>
  );
}
