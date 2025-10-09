import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Filter, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { FilterChips } from '@/components/filters/FilterChips';
import { SavedViewsBar } from '@/components/filters/SavedViewsBar';
import { CalendarEventFilters } from '@/components/admin/calendar/CalendarEventFilters';
import { ExportButton } from '@/components/admin/ExportButton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

const AppointmentsAdvanced = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { filters, updateFilter, clearFilters } = useUrlFilters();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  const filterCount = Object.keys(filters).filter(
    key => filters[key] !== null && filters[key] !== undefined && filters[key] !== ''
  ).length;

  useEffect(() => {
    loadEvents();
  }, [filters]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from("calendar_events")
        .select(`*, accounts(account_name)`)
        .order("start_time", { ascending: false });

      // Apply filters
      if (filters.eventType) {
        query = query.eq("event_type", filters.eventType);
      }

      if (filters.assignedTo) {
        if (filters.assignedTo === 'me') {
          query = query.eq("created_by", user.id);
        } else {
          query = query.eq("created_by", filters.assignedTo);
        }
      }

      if (filters.associatedType) {
        query = query.eq("related_to_type", filters.associatedType);
      }

      if (filters.startDateFrom) {
        query = query.gte("start_time", filters.startDateFrom);
      }

      if (filters.startDateTo) {
        query = query.lte("start_time", filters.startDateTo);
      }

      if (filters.endDateFrom) {
        query = query.gte("end_time", filters.endDateFrom);
      }

      if (filters.endDateTo) {
        query = query.lte("end_time", filters.endDateTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      setEvents(data || []);
    } catch (error: any) {
      console.error("Error loading events:", error);
      toast({
        title: "Error",
        description: "Failed to load calendar events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold">Calendar Events</h1>
            <Badge variant="secondary">{events.length}</Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setFilterPanelOpen(true)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {filterCount > 0 && (
                <Badge variant="default">{filterCount}</Badge>
              )}
            </Button>
            <ExportButton
              data={events}
              moduleName="calendar_events"
              filters={filters}
              isFiltered={filterCount > 0}
              filteredCount={events.length}
            />
          </div>
        </div>

        <SavedViewsBar
          module="calendar_events"
          currentFilters={filters}
          onViewSelect={(newFilters) => {
            Object.entries(newFilters).forEach(([key, value]) => {
              updateFilter(key, value);
            });
          }}
        />

        <FilterChips
          filters={filters}
          onRemove={(key) => updateFilter(key, null)}
          onClearAll={clearFilters}
        />

        {loading ? (
          <div className="text-center py-8">Loading events...</div>
        ) : events.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {filterCount > 0 ? "No events match the current filters" : "No events found"}
            </p>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow
                    key={event.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/dashboard/appointments/${event.id}`)}
                  >
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell className="capitalize">{event.event_type?.replace('_', ' ')}</TableCell>
                    <TableCell>{event.accounts?.account_name || '-'}</TableCell>
                    <TableCell>
                      {format(new Date(event.start_time), "MMM d, yyyy 'at' h:mm a")}
                    </TableCell>
                    <TableCell>
                      <Badge>{event.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        <FilterPanel
          open={filterPanelOpen}
          onClose={() => setFilterPanelOpen(false)}
          title="Filter Calendar Events"
          onClearAll={clearFilters}
        >
          <CalendarEventFilters values={filters} onChange={updateFilter} />
        </FilterPanel>
      </div>
    </AdminLayout>
  );
};

export default AppointmentsAdvanced;
