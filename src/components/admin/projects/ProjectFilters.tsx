import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilters: string[];
  setStatusFilters: (value: string[]) => void;
  managerFilter: string;
  setManagerFilter: (value: string) => void;
}

const ProjectFilters = ({
  searchTerm,
  setSearchTerm,
  statusFilters,
  setStatusFilters,
  managerFilter,
  setManagerFilter,
}: ProjectFiltersProps) => {
  const statuses = [
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const handleStatusToggle = (status: string) => {
    setStatusFilters(
      statusFilters.includes(status)
        ? statusFilters.filter(s => s !== status)
        : [...statusFilters, status]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label>Search</Label>
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label>Status</Label>
          <div className="space-y-2">
            {statuses.map((status) => (
              <div key={status.value} className="flex items-center space-x-2">
                <Checkbox
                  id={status.value}
                  checked={statusFilters.includes(status.value)}
                  onCheckedChange={() => handleStatusToggle(status.value)}
                />
                <label
                  htmlFor={status.value}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {status.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Project Manager Filter */}
        <div className="space-y-2">
          <Label>Project Manager</Label>
          <Select value={managerFilter} onValueChange={setManagerFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="me">Me</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectFilters;