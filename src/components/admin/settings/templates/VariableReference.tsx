import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown, Copy } from 'lucide-react';

interface VariableReferenceProps {
  templateType: string;
}

const serviceVariables = [
  { name: '{{service_name}}', description: 'Service name', example: 'Storm Damage Restoration' },
  { name: '{{service_slug}}', description: 'URL slug', example: 'storm-damage-restoration' },
  { name: '{{service_description}}', description: 'Full description', example: 'Professional storm damage assessment...' },
  { name: '{{service_starting_price}}', description: 'Formatted price', example: '$1,500' },
  { name: '{{service_category}}', description: 'Category', example: 'Emergency Services' },
];

const serviceAreaVariables = [
  { name: '{{city_name}}', description: 'City name', example: 'New Orleans' },
  { name: '{{city_slug}}', description: 'URL slug', example: 'new-orleans' },
  { name: '{{display_name}}', description: 'Full name with state', example: 'New Orleans, Louisiana' },
  { name: '{{local_description}}', description: 'Area-specific description', example: 'Serving the Greater New Orleans area...' },
];

const companyVariables = [
  { name: '{{company_name}}', description: 'Business name', example: 'Clear Home Roofing & Restoration' },
  { name: '{{company_phone}}', description: 'Formatted phone', example: '(504) 555-0123' },
  { name: '{{company_email}}', description: 'Email address', example: 'info@clearhome.com' },
  { name: '{{company_address}}', description: 'Full address', example: '123 Main St, New Orleans, LA 70001' },
  { name: '{{company_description}}', description: 'Business description', example: "Louisiana's trusted roofing experts..." },
  { name: '{{company_slogan}}', description: 'Business tagline', example: 'Your Trusted Roofing Experts' },
  { name: '{{years_experience}}', description: 'Years in business', example: '14' },
  { name: '{{logo_url}}', description: 'Main logo URL', example: '/logo.png' },
  { name: '{{icon_url}}', description: 'Square icon URL', example: '/icon.png' },
];

const VariableReference = ({ templateType }: VariableReferenceProps) => {
  const [openSections, setOpenSections] = useState<string[]>(['company']);
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${text} copied to clipboard`,
    });
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const VariableItem = ({ variable }: { variable: any }) => (
    <div className="p-3 bg-background rounded-lg border mb-2">
      <div className="flex justify-between items-start mb-1">
        <code className="text-sm font-mono text-primary">{variable.name}</code>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => copyToClipboard(variable.name)}
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mb-1">{variable.description}</p>
      <p className="text-xs text-muted-foreground italic">Ex: {variable.example}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Available Variables</h3>
      <p className="text-sm text-muted-foreground">
        Click to copy a variable and paste it into your template.
      </p>

      {templateType === 'service' && (
        <>
          <Collapsible open={openSections.includes('service')} onOpenChange={() => toggleSection('service')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-lg">
              <span className="font-medium">Service Variables</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSections.includes('service') ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              {serviceVariables.map(variable => (
                <VariableItem key={variable.name} variable={variable} />
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={openSections.includes('area')} onOpenChange={() => toggleSection('area')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-lg">
              <span className="font-medium">Service Area Variables</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSections.includes('area') ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              {serviceAreaVariables.map(variable => (
                <VariableItem key={variable.name} variable={variable} />
              ))}
            </CollapsibleContent>
          </Collapsible>
        </>
      )}

      <Collapsible open={openSections.includes('company')} onOpenChange={() => toggleSection('company')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-lg">
          <span className="font-medium">Company Variables</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${openSections.includes('company') ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          {companyVariables.map(variable => (
            <VariableItem key={variable.name} variable={variable} />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default VariableReference;
