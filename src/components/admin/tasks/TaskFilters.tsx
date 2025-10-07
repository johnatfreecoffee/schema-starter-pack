import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface TaskFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilters: string[];
  onStatusChange: (statuses: string[]) => void;
  priorityFilters: string[];
  onPriorityChange: (priorities: string[]) => void;
  assignedFilter: string;
  onAssignedChange: (value: string) => void;
  relatedFilters: string[];
  onRelatedChange: (related: string[]) => void;
  dueDateFilter: string;
  onDueDateChange: (value: string) => void;
  customDateRange: { from?: Date; to?: Date };
  onCustomDateRangeChange: (range: { from?: Date; to?: Date }) => void;
  users: Array<{ id: string; first_name: string; last_name: string }>;
  currentUserId: string;
}

export default function TaskFilters({
  search,
  onSearchChange,
  statusFilters,
  onStatusChange,
  priorityFilters,
  onPriorityChange,
  assignedFilter,
  onAssignedChange,
  relatedFilters,
  onRelatedChange,
  dueDateFilter,
  onDueDateChange,
  customDateRange,
  onCustomDateRangeChange,
  users,
  currentUserId
}: TaskFiltersProps) {
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);

  const handleStatusToggle = (status: string) => {
    if (statusFilters.includes(status)) {
      onStatusChange(statusFilters.filter(s => s !== status));
    } else {
      onStatusChange([...statusFilters, status]);
    }
  };

  const handlePriorityToggle = (priority: string) => {
    if (priorityFilters.includes(priority)) {
      onPriorityChange(priorityFilters.filter(p => p !== priority));
    } else {
      onPriorityChange([...priorityFilters, priority]);
    }
  };

  const handleRelatedToggle = (related: string) => {
    if (relatedFilters.includes(related)) {
      onRelatedChange(relatedFilters.filter(r => r !== related));
    } else {
      onRelatedChange([...relatedFilters, related]);
    }
  };

  return (
    <div className="w-64 space-y-6 p-4 border-r bg-card">
      <div>
        <Label htmlFor="search">Search Tasks</Label>
        <Input
          id="search"
          placeholder="Search by title or description..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="mt-2"
        />
      </div>

      <div>
        <Label>Status</Label>
        <div className="space-y-2 mt-2">
          {['pending', 'in_progress', 'completed', 'cancelled'].map((status) => (
            <div key={status} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${status}`}
                checked={statusFilters.includes(status)}
                onCheckedChange={() => handleStatusToggle(status)}
              />
              <label htmlFor={`status-${status}`} className="text-sm capitalize cursor-pointer">
                {status.replace('_', ' ')}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Priority</Label>
        <div className="space-y-2 mt-2">
          {['high', 'medium', 'low'].map((priority) => (
            <div key={priority} className="flex items-center space-x-2">
              <Checkbox
                id={`priority-${priority}`}
                checked={priorityFilters.includes(priority)}
                onCheckedChange={() => handlePriorityToggle(priority)}
              />
              <label htmlFor={`priority-${priority}`} className="text-sm capitalize cursor-pointer">
                {priority === 'high' && '🔴 '}{priority === 'medium' && '🟡 '}{priority === 'low' && '🟢 '}
                {priority}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Assigned To</Label>
        <Select value={assignedFilter} onValueChange={onAssignedChange}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="me">Me</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.first_name} {user.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Related To</Label>
        <div className="space-y-2 mt-2">
          {['independent', 'lead', 'account', 'project'].map((related) => (
            <div key={related} className="flex items-center space-x-2">
              <Checkbox
                id={`related-${related}`}
                checked={relatedFilters.includes(related)}
                onCheckedChange={() => handleRelatedToggle(related)}
              />
              <label htmlFor={`related-${related}`} className="text-sm capitalize cursor-pointer">
                {related === 'independent' ? 'Independent Tasks' : `Related to ${related}s`}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Due Date</Label>
        <RadioGroup value={dueDateFilter} onValueChange={(value) => {
          onDueDateChange(value);
          setShowCustomDateRange(value === 'custom');
        }} className="mt-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="due-all" />
            <label htmlFor="due-all" className="text-sm cursor-pointer">All Tasks</label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="today" id="due-today" />
            <label htmlFor="due-today" className="text-sm cursor-pointer">Today</label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="week" id="due-week" />
            <label htmlFor="due-week" className="text-sm cursor-pointer">This Week</label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="overdue" id="due-overdue" />
            <label htmlFor="due-overdue" className="text-sm cursor-pointer">Overdue</label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no-due-date" id="due-none" />
            <label htmlFor="due-none" className="text-sm cursor-pointer">No Due Date</label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="custom" id="due-custom" />
            <label htmlFor="due-custom" className="text-sm cursor-pointer">Custom Range</label>
          </div>
        </RadioGroup>

        {showCustomDateRange && (
          <div className="mt-2 space-y-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateRange.from ? format(customDateRange.from, "PPP") : "From date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customDateRange.from}
                  onSelect={(date) => onCustomDateRangeChange({ ...customDateRange, from: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateRange.to ? format(customDateRange.to, "PPP") : "To date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customDateRange.to}
                  onSelect={(date) => onCustomDateRangeChange({ ...customDateRange, to: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </div>
  );
}
