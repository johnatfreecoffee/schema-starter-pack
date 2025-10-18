import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, subMonths, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { enUS } from 'date-fns/locale';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { EventModal } from '@/components/admin/calendar/EventModal';
import { EventDetail } from '@/components/admin/calendar/EventDetail';
import { EventTypeBadge } from '@/components/admin/calendar/EventTypeBadge';
import { ChevronLeft, ChevronRight, Plus, Grid3x3, List, Clock, MapPin, Eye, Pencil, Trash } from 'lucide-react';
import { toast } from 'sonner';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileActionButton } from '@/components/ui/mobile-action-button';
import { MobileCard, MobileCardField } from '@/components/ui/responsive-table';
import { Skeleton } from '@/components/ui/skeleton';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const eventTypeColors = {
  meeting: 'hsl(var(--primary))',
  call: 'hsl(var(--success))',
  appointment: 'hsl(var(--accent))',
  deadline: 'hsl(var(--destructive))',
  task: 'hsl(var(--warning))',
  custom: 'hsl(var(--muted-foreground))',
};

const Calendars = () => {
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [defaultDate, setDefaultDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(true);
  const [calendarView, setCalendarView] = useState<'grid' | 'list'>('grid');
  const isMobile = useIsMobile();

  // Default to list view on mobile
  useEffect(() => {
    if (isMobile) {
      setCalendarView('list');
    }
  }, [isMobile]);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const startDate = startOfMonth(date);
      const endDate = endOfMonth(addMonths(date, 1));

      // Fetch calendar events
      const { data: calendarEvents, error: eventsError } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time');

      if (eventsError) throw eventsError;

      // Fetch tasks with due dates
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .not('due_date', 'is', null)
        .not('status', 'in', '("completed","cancelled")')
        .gte('due_date', startDate.toISOString())
        .lte('due_date', endDate.toISOString());

      if (tasksError) throw tasksError;

      // Transform calendar events
      const transformedEvents = (calendarEvents || []).map((event) => ({
        ...event,
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        title: event.title,
        resource: { type: 'event', data: event },
      }));

      // Transform tasks
      const transformedTasks = (tasks || []).map((task) => ({
        ...task,
        start: new Date(task.due_date),
        end: new Date(task.due_date),
        title: `📋 ${task.title}`,
        resource: { type: 'task', data: task },
        event_type: 'task',
      }));

      setEvents([...transformedEvents, ...transformedTasks]);
    } catch (error: any) {
      toast.error('Failed to load events');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setDefaultDate(start);
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const handleSelectEvent = (event: any) => {
    if (event.resource.type === 'task') {
      window.location.href = `/dashboard/tasks`;
      return;
    }
    setSelectedEvent(event);
    setShowDetailModal(true);
  };

  const handleEditEvent = () => {
    setEditingEvent(selectedEvent);
    setShowDetailModal(false);
    setShowEventModal(true);
  };

  const handleDeleteEvent = () => {
    fetchEvents();
  };

  const handleEventDrop = async ({ event, start, end }: any) => {
    if (event.resource.type === 'task') {
      toast.error('Tasks must be edited in the Tasks module');
      return;
    }

    try {
      const { error } = await supabase
        .from('calendar_events')
        .update({
          start_time: start.toISOString(),
          end_time: end.toISOString(),
        })
        .eq('id', event.id);

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'updated',
          entity_type: 'calendar_event',
          entity_id: event.id,
        });
      }

      toast.success('Event rescheduled');
      fetchEvents();
    } catch (error: any) {
      toast.error('Failed to reschedule event');
    }
  };

  const eventStyleGetter = (event: any) => {
    const color = eventTypeColors[event.event_type as keyof typeof eventTypeColors] || eventTypeColors.custom;
    return {
      style: {
        backgroundColor: color,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  const navigateToday = () => setDate(new Date());
  const navigatePrevious = () => {
    if (view === 'month') setDate(subMonths(date, 1));
    else if (view === 'week') setDate(addDays(date, -7));
    else setDate(addDays(date, -1));
  };
  const navigateNext = () => {
    if (view === 'month') setDate(addMonths(date, 1));
    else if (view === 'week') setDate(addDays(date, 7));
    else setDate(addDays(date, 1));
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-full overflow-x-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 flex-wrap min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold truncate">Calendar</h1>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={navigateToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={navigatePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-wrap">
            {isMobile && (
              <div className="flex border rounded-md mr-2">
                <Button
                  variant={calendarView === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCalendarView('grid')}
                  className="rounded-r-none"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={calendarView === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCalendarView('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            )}
            {!isMobile && (
              <>
                <div className="flex border rounded-md">
                  <Button
                    variant={view === 'month' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setView('month')}
                    className="rounded-r-none"
                  >
                    Month
                  </Button>
                  <Button
                    variant={view === 'week' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setView('week')}
                    className="rounded-none border-x"
                  >
                    Week
                  </Button>
                  <Button
                    variant={view === 'day' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setView('day')}
                    className="rounded-l-none"
                  >
                    Day
                  </Button>
                </div>
                <Button onClick={() => { setDefaultDate(undefined); setEditingEvent(null); setShowEventModal(true); }} className="hidden sm:flex">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Action Button */}
        {!isMobile && (
          <MobileActionButton
            onClick={() => {
              setDefaultDate(undefined);
              setEditingEvent(null);
              setShowEventModal(true);
            }}
            icon={<Plus className="h-5 w-5" />}
            label="Create Event"
          />
        )}

        <div className="text-lg font-medium mb-4">
          {view === 'month' && format(date, 'MMMM yyyy')}
          {view === 'week' && `Week of ${format(startOfWeek(date), 'MMM d')}`}
          {view === 'day' && format(date, 'EEEE, MMMM d, yyyy')}
        </div>

        {loading ? (
          <Card className="p-4">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </Card>
        ) : isMobile && calendarView === 'list' ? (
          <div className="space-y-3">
            {events.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No events scheduled</p>
              </Card>
            ) : (
              events
                .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                .map((event) => (
                  <MobileCard key={event.id} onClick={() => handleSelectEvent(event)}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg mb-1">{event.title}</h3>
                        <EventTypeBadge type={event.event_type} />
                      </div>
                    </div>
                    
                    <MobileCardField 
                      label="Date & Time" 
                      value={`${format(event.start, 'MMM d, yyyy')} at ${format(event.start, 'h:mm a')}${event.end ? ` - ${format(event.end, 'h:mm a')}` : ''}`}
                    />
                    
                    {event.location && (
                      <MobileCardField 
                        label="Location" 
                        value={event.location}
                      />
                    )}
                    
                    {event.description && (
                      <MobileCardField 
                        label="Description" 
                        value={<p className="text-sm line-clamp-2">{event.description}</p>}
                      />
                    )}
                    
                    {event.resource.type !== 'task' && (
                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                            setShowDetailModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEvent(event);
                            setShowEventModal(true);
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    )}
                  </MobileCard>
                ))
            )}
          </div>
        ) : (
          <Card className="p-4">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              onEventDrop={handleEventDrop}
              selectable
              resizable
              eventPropGetter={eventStyleGetter}
              style={{ height: isMobile ? 400 : 600 }}
              views={isMobile ? ['month'] : ['month', 'week', 'day']}
            />
          </Card>
        )}

        {!isMobile && (
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: eventTypeColors.meeting }} />
              <span className="text-sm">Meetings</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: eventTypeColors.call }} />
              <span className="text-sm">Calls</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: eventTypeColors.appointment }} />
              <span className="text-sm">Appointments</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: eventTypeColors.deadline }} />
              <span className="text-sm">Deadlines</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: eventTypeColors.task }} />
              <span className="text-sm">Tasks</span>
            </div>
          </div>
        )}
      </div>

      {isMobile && (
        <MobileActionButton
          onClick={() => { setDefaultDate(undefined); setEditingEvent(null); setShowEventModal(true); }}
          icon={<Plus className="h-6 w-6" />}
          label="Create Event"
        />
      )}

      <EventModal
        open={showEventModal}
        onClose={() => setShowEventModal(false)}
        onSuccess={fetchEvents}
        event={editingEvent}
        defaultDate={defaultDate}
      />

      {selectedEvent && (
        <EventDetail
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          event={selectedEvent}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
        />
      )}
    </AdminLayout>
  );
};

export default Calendars;
