import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  RefreshCw, 
  FileEdit, 
  Clock, 
  FileText 
} from 'lucide-react';

interface WorkflowTriggerCardProps {
  triggerType: string;
  triggerModule: string;
  onTriggerChange: (type: string, module: string) => void;
}

const triggerTypes = [
  {
    id: 'record_created',
    label: 'Record Created',
    description: 'When a new record is created',
    icon: Plus,
    requiresModule: true,
  },
  {
    id: 'record_updated',
    label: 'Record Updated',
    description: 'When any field on a record changes',
    icon: RefreshCw,
    requiresModule: true,
  },
  {
    id: 'field_changed',
    label: 'Field Changed',
    description: 'When a specific field changes',
    icon: FileEdit,
    requiresModule: true,
  },
  {
    id: 'time_based',
    label: 'Time-Based',
    description: 'Run on a schedule (daily, weekly, monthly)',
    icon: Clock,
    requiresModule: false,
  },
  {
    id: 'form_submitted',
    label: 'Form Submitted',
    description: 'When a lead form is submitted',
    icon: FileText,
    requiresModule: false,
  },
];

const modules = [
  { id: 'leads', label: 'Leads' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'projects', label: 'Projects' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'calendar_events', label: 'Appointments' },
  { id: 'quotes', label: 'Quotes' },
  { id: 'invoices', label: 'Invoices' },
];

export const WorkflowTriggerCard = ({
  triggerType,
  triggerModule,
  onTriggerChange,
}: WorkflowTriggerCardProps) => {
  const selectedTrigger = triggerTypes.find(t => t.id === triggerType);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {triggerTypes.map((trigger) => {
          const Icon = trigger.icon;
          const isSelected = triggerType === trigger.id;

          return (
            <Card
              key={trigger.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onTriggerChange(trigger.id, triggerModule)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{trigger.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {trigger.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedTrigger?.requiresModule && (
        <div className="mt-4">
          <Label htmlFor="module">Select Module</Label>
          <Select value={triggerModule} onValueChange={(value) => onTriggerChange(triggerType, value)}>
            <SelectTrigger id="module">
              <SelectValue placeholder="Choose a module" />
            </SelectTrigger>
            <SelectContent>
              {modules.map((module) => (
                <SelectItem key={module.id} value={module.id}>
                  {module.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};
