import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface LeadFiltersProps {
  onFiltersChange: (filters: any) => void;
  statusCounts: Record<string, number>;
  services: string[];
  users: Array<{ id: string; name: string }>;
}

export const LeadFilters = ({ onFiltersChange, statusCounts, services, users }: LeadFiltersProps) => {
  const [search, setSearch] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState('all');
  const [assignedTo, setAssignedTo] = useState('all');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const statuses = ['new', 'contacted', 'qualified', 'converted', 'lost'];

  const handleStatusToggle = (status: string) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter(s => s !== status)
      : [...selectedStatuses, status];
    setSelectedStatuses(newStatuses);
    applyFilters({ selectedStatuses: newStatuses });
  };

  const applyFilters = (updates: any = {}) => {
    onFiltersChange({
      search,
      statuses: selectedStatuses,
      service: selectedService,
      assignedTo,
      emergencyOnly,
      dateFrom,
      dateTo,
      ...updates
    });
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedStatuses([]);
    setSelectedService('all');
    setAssignedTo('all');
    setEmergencyOnly(false);
    setDateFrom(undefined);
    setDateTo(undefined);
    onFiltersChange({});
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <Label>Search</Label>
        <Input
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            applyFilters({ search: e.target.value });
          }}
          className="mt-2"
        />
      </div>

      {/* Status Filter */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Status</Label>
          <div className="space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSelectedStatuses(statuses);
                applyFilters({ selectedStatuses: statuses });
              }}
            >
              All
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSelectedStatuses([]);
                applyFilters({ selectedStatuses: [] });
              }}
            >
              Clear
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {statuses.map(status => (
            <div key={status} className="flex items-center space-x-2">
              <Checkbox
                id={status}
                checked={selectedStatuses.includes(status)}
                onCheckedChange={() => handleStatusToggle(status)}
              />
              <label
                htmlFor={status}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer capitalize flex-1"
              >
                {status} ({statusCounts[status] || 0})
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Service Filter */}
      <div>
        <Label>Service</Label>
        <Select value={selectedService} onValueChange={(value) => {
          setSelectedService(value);
          applyFilters({ service: value });
        }}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {services.map(service => (
              <SelectItem key={service} value={service}>{service}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range */}
      <div>
        <Label>Date Range</Label>
        <div className="space-y-2 mt-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, 'PPP') : 'From date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={(date) => {
                  setDateFrom(date);
                  applyFilters({ dateFrom: date });
                }}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, 'PPP') : 'To date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={(date) => {
                  setDateTo(date);
                  applyFilters({ dateTo: date });
                }}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          {(dateFrom || dateTo) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setDateFrom(undefined);
                setDateTo(undefined);
                applyFilters({ dateFrom: undefined, dateTo: undefined });
              }}
              className="w-full"
            >
              <X className="mr-2 h-4 w-4" />
              Clear dates
            </Button>
          )}
        </div>
      </div>

      {/* Emergency Filter */}
      <div className="flex items-center justify-between">
        <Label htmlFor="emergency">Emergency Only</Label>
        <Switch
          id="emergency"
          checked={emergencyOnly}
          onCheckedChange={(checked) => {
            setEmergencyOnly(checked);
            applyFilters({ emergencyOnly: checked });
          }}
        />
      </div>

      {/* Assigned To Filter */}
      <div>
        <Label>Assigned To</Label>
        <Select value={assignedTo} onValueChange={(value) => {
          setAssignedTo(value);
          applyFilters({ assignedTo: value });
        }}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {users.map(user => (
              <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear All */}
      <Button 
        variant="outline" 
        className="w-full" 
        onClick={clearFilters}
      >
        Clear All Filters
      </Button>
    </div>
  );
};