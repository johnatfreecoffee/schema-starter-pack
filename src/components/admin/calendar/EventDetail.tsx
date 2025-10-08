import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EventTypeBadge } from './EventTypeBadge';
import { format } from 'date-fns';
import { MapPin, Calendar, Clock, FileText, Link as LinkIcon, Trash2, Edit } from 'lucide-react';
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

interface EventDetailProps {
  open: boolean;
  onClose: () => void;
  event: any;
  onEdit: () => void;
  onDelete: () => void;
}

export const EventDetail = ({ open, onClose, event, onEdit, onDelete }: EventDetailProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!event) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', event.id);

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'deleted',
        entity_type: 'calendar_event',
        entity_id: event.id,
      });

      toast.success('Event deleted successfully');
      setShowDeleteDialog(false);
      onDelete();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);
  const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl mb-2">{event.title}</DialogTitle>
                <EventTypeBadge type={event.event_type} />
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">
                  {format(startDate, 'EEEE, MMMM d, yyyy')}
                  {!event.all_day && ` at ${format(startDate, 'h:mm a')}`}
                </p>
                {!event.all_day && (
                  <p className="text-sm text-muted-foreground">
                    Until {format(endDate, 'h:mm a')}
                  </p>
                )}
              </div>
            </div>

            {!event.all_day && (
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm">
                  Duration: {hours > 0 && `${hours} hour${hours > 1 ? 's' : ''}`}
                  {hours > 0 && minutes > 0 && ' '}
                  {minutes > 0 && `${minutes} minute${minutes > 1 ? 's' : ''}`}
                </p>
              </div>
            )}

            {event.description && (
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-1">Description</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                </div>
              </div>
            )}

            {event.location && (
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Location</p>
                  <p className="text-sm text-muted-foreground">{event.location}</p>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    View on Google Maps
                  </a>
                </div>
              </div>
            )}

            {event.related_to_type && event.related_to_id && (
              <div className="flex items-start space-x-3">
                <LinkIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Related To</p>
                  <p className="text-sm">
                    {event.related_to_type === 'lead' && 'Lead: '}
                    {event.related_to_type === 'account' && 'Account: '}
                    {event.related_to_type === 'project' && 'Project: '}
                    <a
                      href={`/dashboard/${event.related_to_type}s/${event.related_to_id}`}
                      className="text-primary hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = `/dashboard/${event.related_to_type}s/${event.related_to_id}`;
                      }}
                    >
                      View {event.related_to_type}
                    </a>
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{event.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
