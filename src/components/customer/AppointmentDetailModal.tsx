import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, FileText, Download, X } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

interface AppointmentDetailModalProps {
  event: CalendarEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

const AppointmentDetailModal = ({ event, open, onOpenChange, onUpdate }: AppointmentDetailModalProps) => {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('calendar_events')
        .update({ status: 'canceled' })
        .eq('id', event.id);

      if (error) throw error;

      toast.success('Appointment cancelled successfully');
      setCancelDialogOpen(false);
      onOpenChange(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    } finally {
      setLoading(false);
    }
  };

  const downloadICS = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Your Company//Appointments//EN
BEGIN:VEVENT
UID:${event.id}
DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss")}
DTSTART:${format(event.start, "yyyyMMdd'T'HHmmss")}
DTEND:${format(event.end, "yyyyMMdd'T'HHmmss")}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
LOCATION:${event.location || ''}
STATUS:${event.status.toUpperCase()}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `appointment-${event.id}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      scheduled: 'default',
      completed: 'secondary',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const isUpcoming = event.start > new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-2xl">{event.title}</DialogTitle>
            {getStatusBadge(event.status)}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(event.start, 'PPPP')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Time</p>
                <p className="text-sm text-muted-foreground">
                  {format(event.start, 'p')} - {format(event.end, 'p')}
                </p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{event.location}</p>
                </div>
              </div>
            )}

            {event.created_by_name && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Meeting With</p>
                  <p className="text-sm text-muted-foreground">{event.created_by_name}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Event Type</p>
                <p className="text-sm text-muted-foreground">{event.event_type}</p>
              </div>
            </div>
          </div>

          {event.description && (
            <div>
              <p className="font-medium mb-2">Description</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {isUpcoming && (
            <div className="pt-4 border-t">
              <Button onClick={downloadICS} variant="outline" className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Add to Calendar (.ics)
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Download this event to add it to Google Calendar, Outlook, or Apple Calendar
              </p>
            </div>
          )}

          {event.status === 'scheduled' && isUpcoming && (
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="destructive"
                onClick={() => setCancelDialogOpen(true)}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Appointment
              </Button>
            </div>
          )}
        </div>
      </DialogContent>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep It</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={loading}>
              {loading ? 'Cancelling...' : 'Yes, Cancel'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default AppointmentDetailModal;
