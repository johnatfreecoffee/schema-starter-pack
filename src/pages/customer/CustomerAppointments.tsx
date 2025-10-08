import { useState, useEffect, useMemo } from 'react';
import CustomerLayout from '@/components/layout/CustomerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, List, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import AppointmentDetailModal from '@/components/customer/AppointmentDetailModal';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: string;
  event_type: string;
  location?: string;
  description?: string;
  created_by_name?: string;
  related_project?: string;
}

const CustomerAppointments = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!account) return;

      const { data: calendarEvents, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          created_by:created_by(first_name, last_name)
        `)
        .eq('related_to_type', 'account')
        .eq('related_to_id', account.id)
        .order('start_time', { ascending: true });

      if (error) throw error;

      const formattedEvents: CalendarEvent[] = (calendarEvents || []).map((event: any) => ({
        id: event.id,
        title: event.title,
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        status: getEventStatus(event),
        event_type: event.event_type,
        location: event.location,
        description: event.description,
        created_by_name: event.created_by ? `${event.created_by.first_name} ${event.created_by.last_name}` : 'N/A',
      }));

      setEvents(formattedEvents);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load appointments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getEventStatus = (event: any) => {
    const now = new Date();
    const endTime = new Date(event.end_time);
    if (endTime < now) return 'completed';
    return 'scheduled';
  };

  const filteredAndSortedEvents = useMemo(() => {
    let filtered = events;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      const dateA = a.start as Date;
      const dateB = b.start as Date;
      return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
    });
  }, [events, statusFilter, searchQuery, sortOrder]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return filteredAndSortedEvents.filter(e => (e.start as Date) > now);
  }, [filteredAndSortedEvents]);

  const pastEvents = useMemo(() => {
    const now = new Date();
    return filteredAndSortedEvents.filter(e => (e.end as Date) <= now);
  }, [filteredAndSortedEvents]);

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3b82f6';
    if (event.status === 'completed') backgroundColor = '#10b981';
    if (event.status === 'cancelled') backgroundColor = '#ef4444';

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      scheduled: 'default',
      completed: 'secondary',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-muted-foreground mt-1">View and manage your appointments</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search appointments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'asc' | 'desc')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Date Ascending</SelectItem>
              <SelectItem value="desc">Date Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              List
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <Card>
              <CardContent className="pt-6">
                <Calendar
                  localizer={localizer}
                  events={filteredAndSortedEvents}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 600 }}
                  onSelectEvent={handleEventClick}
                  eventPropGetter={eventStyleGetter}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list">
            <div className="space-y-6">
              {upcomingEvents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className="flex items-start justify-between p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(event.start as Date, 'PPP p')} - {format(event.end as Date, 'p')}
                          </p>
                          {event.location && (
                            <p className="text-sm text-muted-foreground mt-1">📍 {event.location}</p>
                          )}
                          <p className="text-sm mt-1">Type: {event.event_type}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(event.status)}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {pastEvents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Past</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {pastEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className="flex items-start justify-between p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(event.start as Date, 'PPP p')} - {format(event.end as Date, 'p')}
                          </p>
                          {event.location && (
                            <p className="text-sm text-muted-foreground mt-1">📍 {event.location}</p>
                          )}
                          <p className="text-sm mt-1">Type: {event.event_type}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(event.status)}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {filteredAndSortedEvents.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No appointments found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {selectedEvent && (
        <AppointmentDetailModal
          event={selectedEvent}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      )}
    </CustomerLayout>
  );
};

export default CustomerAppointments;
