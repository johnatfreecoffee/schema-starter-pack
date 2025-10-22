import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface VariablePickerProps {
  onInsert: (variable: string) => void;
  includeServiceVars?: boolean;
  includeServiceAreaVars?: boolean;
}

const companyVariables = [
  { name: 'company_name', description: 'Company business name' },
  { name: 'company_phone', description: 'Formatted phone number' },
  { name: 'company_email', description: 'Company email address' },
  { name: 'company_address', description: 'Company physical address' },
  { name: 'company_slogan', description: 'Business slogan' },
  { name: 'years_experience', description: 'Years in business' },
  { name: 'logo_url', description: 'Company logo URL' },
];

const serviceVariables = [
  { name: 'service_name', description: 'Service name' },
  { name: 'service_description', description: 'Service description' },
  { name: 'service_starting_price', description: 'Starting price' },
  { name: 'service_slug', description: 'Service URL slug' },
];

const serviceAreaVariables = [
  { name: 'city_name', description: 'City name' },
  { name: 'city_slug', description: 'City URL slug' },
  { name: 'display_name', description: 'Display name for area' },
  { name: 'area_display_name', description: 'Area display name' },
  { name: 'local_description', description: 'Localized description' },
];

const VariablePicker = ({ 
  onInsert, 
  includeServiceVars = true,
  includeServiceAreaVars = true 
}: VariablePickerProps) => {
  const [open, setOpen] = useState(false);

  const handleInsert = (varName: string) => {
    onInsert(`{{${varName}}}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          Variables
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <Tabs defaultValue="company">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="company">Company</TabsTrigger>
            {includeServiceVars && <TabsTrigger value="service">Service</TabsTrigger>}
            {includeServiceAreaVars && <TabsTrigger value="area">Area</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="company">
            <ScrollArea className="h-64">
              <div className="space-y-2 pr-4">
                {companyVariables.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => handleInsert(v.name)}
                    className="w-full text-left p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <div className="font-mono text-sm text-primary">
                      {`{{${v.name}}}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {v.description}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          {includeServiceVars && (
            <TabsContent value="service">
              <ScrollArea className="h-64">
                <div className="space-y-2 pr-4">
                  {serviceVariables.map((v) => (
                    <button
                      key={v.name}
                      onClick={() => handleInsert(v.name)}
                      className="w-full text-left p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <div className="font-mono text-sm text-primary">
                        {`{{${v.name}}}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {v.description}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          )}
          
          {includeServiceAreaVars && (
            <TabsContent value="area">
              <ScrollArea className="h-64">
                <div className="space-y-2 pr-4">
                  {serviceAreaVariables.map((v) => (
                    <button
                      key={v.name}
                      onClick={() => handleInsert(v.name)}
                      className="w-full text-left p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <div className="font-mono text-sm text-primary">
                        {`{{${v.name}}}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {v.description}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};

export default VariablePicker;
