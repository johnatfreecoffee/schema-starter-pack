import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { CRUDLogger } from '@/lib/crudLogger';

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  event?: any;
  defaultDate?: Date;
}

export const EventModal = ({ open, onClose, onSuccess, event, defaultDate }: EventModalProps) => {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [allDay, setAllDay] = useState(event?.all_day || false);
  const [relatedToType, setRelatedToType] = useState(event?.related_to_type || '');
  const [leads, setLeads] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      title: event?.title || '',
      description: event?.description || '',
      event_type: event?.event_type || 'meeting',
      start_time: event?.start_time ? format(new Date(event.start_time), "yyyy-MM-dd'T'HH:mm") : defaultDate ? format(defaultDate, "yyyy-MM-dd'T'HH:mm") : '',
      end_time: event?.end_time ? format(new Date(event.end_time), "yyyy-MM-dd'T'HH:mm") : defaultDate ? format(new Date(defaultDate.getTime() + 3600000), "yyyy-MM-dd'T'HH:mm") : '',
      location: event?.location || '',
      related_to_id: event?.related_to_id || '',
    },
  });

  useEffect(() => {
    if (relatedToType === 'lead') {
      fetchLeads();
    } else if (relatedToType === 'account') {
      fetchAccounts();
    }
  }, [relatedToType]);

  useEffect(() => {
    if (event) {
      reset({
        title: event.title,
        description: event.description || '',
        event_type: event.event_type,
        start_time: format(new Date(event.start_time), "yyyy-MM-dd'T'HH:mm"),
        end_time: format(new Date(event.end_time), "yyyy-MM-dd'T'HH:mm"),
        location: event.location || '',
        related_to_id: event.related_to_id || '',
      });
      setAllDay(event.all_day || false);
      setRelatedToType(event.related_to_type || '');
    } else if (defaultDate) {
      reset({
        start_time: format(defaultDate, "yyyy-MM-dd'T'HH:mm"),
        end_time: format(new Date(defaultDate.getTime() + 3600000), "yyyy-MM-dd'T'HH:mm"),
      });
    }
  }, [event, defaultDate, reset]);

  const fetchLeads = async () => {
    const { data } = await supabase.from('leads').select('id, first_name, last_name').order('created_at', { ascending: false });
    if (data) setLeads(data);
  };

  const fetchAccounts = async () => {
    const { data } = await supabase.from('accounts').select('id, account_name').order('created_at', { ascending: false });
    if (data) setAccounts(data);
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const eventData = {
        title: data.title,
        description: data.description,
        event_type: data.event_type,
        start_time: new Date(data.start_time).toISOString(),
        end_time: new Date(data.end_time).toISOString(),
        all_day: allDay,
        location: data.location,
        related_to_type: relatedToType || null,
        related_to_id: data.related_to_id || null,
        created_by: user.id,
      };

      if (event) {
        const changes = CRUDLogger.calculateChanges(event, eventData);
        
        const { error } = await supabase
          .from('calendar_events')
          .update(eventData)
          .eq('id', event.id);
        
        if (error) throw error;

        await CRUDLogger.logUpdate({
          userId: user.id,
          entityType: 'appointment',
          entityId: event.id,
          entityName: data.title,
          changes
        });

        toast.success('Event updated successfully');
      } else {
        const { data: newEvent, error } = await supabase
          .from('calendar_events')
          .insert(eventData)
          .select()
          .single();
        
        if (error) throw error;

        await CRUDLogger.logCreate({
          userId: user.id,
          entityType: 'appointment',
          entityId: newEvent.id,
          entityName: data.title
        });

        toast.success('Event created successfully');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input id="title" {...register('title', { required: true })} placeholder="e.g., Client meeting with John Smith" className="min-h-[44px]" />
      </div>

      <div>
        <Label htmlFor="event_type">Event Type *</Label>
        <Select onValueChange={(value) => setValue('event_type', value)} defaultValue={watch('event_type')}>
          <SelectTrigger className="min-h-[44px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="meeting">Meeting</SelectItem>
            <SelectItem value="call">Call</SelectItem>
            <SelectItem value="appointment">Appointment</SelectItem>
            <SelectItem value="deadline">Deadline</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="all_day" checked={allDay} onCheckedChange={(checked) => setAllDay(checked as boolean)} />
        <Label htmlFor="all_day" className="cursor-pointer">All-day event</Label>
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        <div>
          <Label htmlFor="start_time">Start {!allDay && 'Time'} *</Label>
          <Input id="start_time" type={allDay ? 'date' : 'datetime-local'} {...register('start_time', { required: true })} className="min-h-[44px]" />
        </div>
        <div>
          <Label htmlFor="end_time">End {!allDay && 'Time'} *</Label>
          <Input id="end_time" type={allDay ? 'date' : 'datetime-local'} {...register('end_time', { required: true })} className="min-h-[44px]" />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register('description')} rows={4} placeholder="Add details, agenda, notes..." className="min-h-[44px]" />
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input id="location" {...register('location')} placeholder="e.g., Conference Room A, Customer Site, Zoom" className="min-h-[44px]" />
      </div>

      <div>
        <Label htmlFor="related_to">Relate to</Label>
        <Select onValueChange={setRelatedToType} defaultValue={relatedToType}>
          <SelectTrigger className="min-h-[44px]">
            <SelectValue placeholder="None (Independent)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="account">Account</SelectItem>
            <SelectItem value="project">Project</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {relatedToType === 'lead' && (
        <div>
          <Label htmlFor="related_to_id">Select Lead</Label>
          <Select onValueChange={(value) => setValue('related_to_id', value)} defaultValue={watch('related_to_id')}>
            <SelectTrigger className="min-h-[44px]">
              <SelectValue placeholder="Choose a lead" />
            </SelectTrigger>
            <SelectContent>
              {leads.map((lead) => (
                <SelectItem key={lead.id} value={lead.id}>
                  {lead.first_name} {lead.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {relatedToType === 'account' && (
        <div>
          <Label htmlFor="related_to_id">Select Account</Label>
          <Select onValueChange={(value) => setValue('related_to_id', value)} defaultValue={watch('related_to_id')}>
            <SelectTrigger className="min-h-[44px]">
              <SelectValue placeholder="Choose an account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.account_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className={`flex ${isMobile ? 'flex-col' : 'justify-end'} space-x-2 gap-2`}>
        <Button type="button" variant="outline" onClick={onClose} className={isMobile ? 'w-full' : ''}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className={isMobile ? 'w-full' : ''}>
          {loading ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{event ? 'Edit Event' : 'Create New Event'}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{formContent}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'Create New Event'}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};
