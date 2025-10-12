import { Database, Users, Building2, Briefcase, CheckSquare, FileText, Receipt } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const DATA_SOURCES = [
  { value: 'leads', label: 'Leads', icon: Users, color: 'text-blue-500', description: 'Lead submissions and inquiries' },
  { value: 'accounts', label: 'Accounts', icon: Building2, color: 'text-green-500', description: 'Customer accounts and companies' },
  { value: 'contacts', label: 'Contacts', icon: Users, color: 'text-purple-500', description: 'Individual contact records' },
  { value: 'projects', label: 'Projects', icon: Briefcase, color: 'text-orange-500', description: 'Active and completed projects' },
  { value: 'tasks', label: 'Tasks', icon: CheckSquare, color: 'text-yellow-500', description: 'Task assignments and status' },
  { value: 'quotes', label: 'Quotes', icon: FileText, color: 'text-cyan-500', description: 'Quote proposals and estimates' },
  { value: 'invoices', label: 'Invoices', icon: Receipt, color: 'text-red-500', description: 'Invoice and payment records' },
];

interface DataSourceStepProps {
  config: { data_source: string };
  onUpdate: (updates: { data_source: string }) => void;
}

const DataSourceStep = ({ config, onUpdate }: DataSourceStepProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Select Data Source</h2>
        <p className="text-muted-foreground">
          Choose which CRM module you want to create a report for
        </p>
      </div>

      <RadioGroup
        value={config.data_source}
        onValueChange={(value) => onUpdate({ data_source: value })}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6"
      >
        {DATA_SOURCES.map((source) => (
          <div key={source.value} className="relative">
            <RadioGroupItem
              value={source.value}
              id={source.value}
              className="peer sr-only"
            />
            <Label
              htmlFor={source.value}
              className="flex flex-col p-4 border rounded-lg cursor-pointer hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
            >
              <div className="flex items-center gap-3 mb-2">
                <source.icon className={`h-5 w-5 ${source.color}`} />
                <span className="font-semibold">{source.label}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {source.description}
              </span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default DataSourceStep;
