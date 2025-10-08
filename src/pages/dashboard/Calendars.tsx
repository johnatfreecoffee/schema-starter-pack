import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, subMonths, startOfMonth, endOfMonth, addDays } from 'date-fns';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { EventModal } from '@/components/admin/calendar/EventModal';
import { EventDetail } from '@/components/admin/calendar/EventDetail';
import { EventTypeBadge } from '@/components/admin/calendar/EventTypeBadge';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { toast } from 'sonner';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-US': require('date-fns/locale/en-US') };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const eventTypeColors = {
  meeting: '#3B82F6',
  call: '#10B981',
  appointment: '#8B5CF6',
  deadline: '#EF4444',
  task: '#F59E0B',
  custom: '#6B7280',
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-4xl font-bold">Calendar</h1>
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
              <span className="text-lg font-medium px-4">
                {view === 'month' && format(date, 'MMMM yyyy')}
                {view === 'week' && `Week of ${format(startOfWeek(date), 'MMM d')}`}
                {view === 'day' && format(date, 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
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
            <Button onClick={() => { setDefaultDate(undefined); setEditingEvent(null); setShowEventModal(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>
        </div>

        <Card className="p-4">
          {loading ? (
            <div className="flex items-center justify-center h-[600px]">
              <p className="text-muted-foreground">Loading calendar...</p>
            </div>
          ) : (
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
              style={{ height: 600 }}
              views={['month', 'week', 'day']}
            />
          )}
        </Card>

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
      </div>

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
