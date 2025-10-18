import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import SettingsTabs from '@/components/layout/SettingsTabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const notificationEvents = [
  { type: 'lead_created', label: 'New Lead Created', description: 'Send welcome email to new leads' },
  { type: 'lead_assigned', label: 'Lead Assigned', description: 'Notify user when lead is assigned to them' },
  { type: 'task_assigned', label: 'Task Assigned', description: 'Notify user when task is assigned' },
  { type: 'task_due_soon', label: 'Task Due Soon', description: 'Reminder 1 day before task due date' },
  { type: 'invoice_sent', label: 'Invoice Sent', description: 'Send invoice to customer' },
  { type: 'payment_received', label: 'Payment Received', description: 'Send payment confirmation' },
  { type: 'project_status_changed', label: 'Project Status Changed', description: 'Notify when project status updates' },
  { type: 'appointment_scheduled', label: 'Appointment Scheduled', description: 'Send appointment confirmation' },
  { type: 'appointment_reminder', label: 'Appointment Reminder', description: 'Send reminder 24 hours before appointment' }
];

const Notifications = () => {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const { data: templates } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  const { data: settings } = useQuery({
    queryKey: ['notification-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({
      eventType,
      emailEnabled,
      templateId
    }: {
      eventType: string;
      emailEnabled?: boolean;
      templateId?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const existing = settings?.find(s => s.event_type === eventType);

      const settingData = {
        user_id: user.id,
        event_type: eventType,
        ...(emailEnabled !== undefined && { email_enabled: emailEnabled }),
        ...(templateId !== undefined && { template_id: templateId || null })
      };

      if (existing) {
        const { error } = await supabase
          .from('notification_settings')
          .update(settingData)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notification_settings')
          .insert({
            ...settingData,
            email_enabled: emailEnabled ?? true
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      toast.success('Notification settings updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update settings');
    }
  });

  const getSetting = (eventType: string) => {
    return settings?.find(s => s.event_type === eventType);
  };

  return (
    <>
      <SettingsTabs />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Notification Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure when and how you receive notifications for different CRM events.
          </p>
        </div>

        <div className="space-y-4">
          {notificationEvents.map((event) => {
            const setting = getSetting(event.type);
            const isEnabled = setting?.email_enabled ?? false;

            return (
              <Card key={event.type}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{event.label}</CardTitle>
                      <CardDescription>{event.description}</CardDescription>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) =>
                        updateSettingMutation.mutate({
                          eventType: event.type,
                          emailEnabled: checked
                        })
                      }
                    />
                  </div>
                </CardHeader>
                {isEnabled && (
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor={`template-${event.type}`}>Email Template</Label>
                      <Select
                        value={setting?.template_id || ''}
                        onValueChange={(value) =>
                          updateSettingMutation.mutate({
                            eventType: event.type,
                            templateId: value
                          })
                        }
                      >
                        <SelectTrigger id={`template-${event.type}`}>
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates?.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Notifications;
