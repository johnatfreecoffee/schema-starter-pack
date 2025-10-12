import { BarChart3, LineChart, PieChart, Table } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const VISUALIZATION_TYPES = [
  {
    value: 'table',
    label: 'Table',
    icon: Table,
    description: 'Display data in a sortable table format',
  },
  {
    value: 'bar',
    label: 'Bar Chart',
    icon: BarChart3,
    description: 'Compare values across categories',
  },
  {
    value: 'line',
    label: 'Line Chart',
    icon: LineChart,
    description: 'Show trends over time',
  },
  {
    value: 'pie',
    label: 'Pie Chart',
    icon: PieChart,
    description: 'Show proportions of a whole',
  },
];

interface VisualizationStepProps {
  config: { visualization_type: string };
  onUpdate: (updates: { visualization_type: string }) => void;
}

const VisualizationStep = ({ config, onUpdate }: VisualizationStepProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Choose Visualization</h2>
        <p className="text-muted-foreground">
          Select how you want to display your report data
        </p>
      </div>

      <RadioGroup
        value={config.visualization_type}
        onValueChange={(value) => onUpdate({ visualization_type: value })}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6"
      >
        {VISUALIZATION_TYPES.map((type) => (
          <div key={type.value} className="relative">
            <RadioGroupItem
              value={type.value}
              id={type.value}
              className="peer sr-only"
            />
            <Label
              htmlFor={type.value}
              className="flex flex-col p-6 border-2 rounded-lg cursor-pointer hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
            >
              <type.icon className="h-8 w-8 text-primary mb-3" />
              <span className="font-semibold text-lg mb-1">{type.label}</span>
              <span className="text-sm text-muted-foreground">
                {type.description}
              </span>
            </Label>
          </div>
        ))}
      </RadioGroup>

      <div className="p-4 bg-muted rounded-lg mt-6">
        <h4 className="font-medium mb-2">Tips:</h4>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Use tables for detailed record views</li>
          <li>Bar charts work best for comparing categories</li>
          <li>Line charts are ideal for time-based trends</li>
          <li>Pie charts show parts of a whole (limit to 5-7 slices)</li>
        </ul>
      </div>
    </div>
  );
};

export default VisualizationStep;
