import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface RequestAppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  appointment_type: 'onsite' | 'virtual' | 'phone';
  preferred_date: Date;
  preferred_time: string;
  title: string;
  description: string;
  location?: string;
  notes?: string;
}

export const RequestAppointmentForm = ({ open, onOpenChange, onSuccess }: RequestAppointmentFormProps) => {
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [appointmentType, setAppointmentType] = useState<string>('onsite');
  
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormData>();

  useEffect(() => {
    const fetchAccountId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (account) setAccountId(account.id);
    };

    fetchAccountId();
  }, []);

  const onSubmit = async (data: FormData) => {
    if (!accountId) {
      toast.error('Unable to identify your account');
      return;
    }

    if (!selectedDate) {
      toast.error('Please select a preferred date');
      return;
    }

    setLoading(true);
    
    try {
      // Combine date and time
      const [hours, minutes] = data.preferred_time.split(':');
      const startTime = new Date(selectedDate);
      startTime.setHours(parseInt(hours), parseInt(minutes), 0);
      
      // Default to 1 hour appointment
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1);

      const { error } = await supabase.from('calendar_events').insert({
        account_id: accountId,
        title: data.title,
        description: data.description,
        appointment_type: data.appointment_type,
        status: 'requested',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        location: data.appointment_type === 'onsite' ? data.location : null,
        notes: data.notes,
        created_by: (await supabase.auth.getUser()).data.user?.id || '',
      });

      if (error) throw error;

      toast.success('Appointment request submitted successfully');
      reset();
      setSelectedDate(undefined);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error requesting appointment:', error);
      toast.error('Failed to submit appointment request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Appointment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Purpose/Title *</Label>
            <Input
              id="title"
              {...register('title', { required: 'Title is required' })}
              placeholder="e.g., Project Consultation"
            />
            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <Label htmlFor="appointment_type">Appointment Type *</Label>
            <Select
              value={appointmentType}
              onValueChange={(value) => {
                setAppointmentType(value);
                setValue('appointment_type', value as any);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="onsite">On-Site Visit</SelectItem>
                <SelectItem value="virtual">Virtual Meeting</SelectItem>
                <SelectItem value="phone">Phone Call</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" {...register('appointment_type', { required: true })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Preferred Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="preferred_time">Preferred Time *</Label>
              <Input
                id="preferred_time"
                type="time"
                {...register('preferred_time', { required: 'Time is required' })}
              />
              {errors.preferred_time && <p className="text-sm text-destructive mt-1">{errors.preferred_time.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register('description', { required: 'Description is required' })}
              placeholder="Please describe what you'd like to discuss..."
              rows={3}
            />
            {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
          </div>

          {appointmentType === 'onsite' && (
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                {...register('location')}
                placeholder="Address for on-site visit"
              />
            </div>
          )}

          <div>
            <Label htmlFor="notes">Special Requests (Optional)</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Any special requirements or requests..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
