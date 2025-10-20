import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Save, Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface BackupSchedule {
  id: string;
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time_of_day: string;
  backup_type: 'full' | 'incremental';
  retention_count: number;
  email_notifications: boolean;
  notification_email: string | null;
  last_run_at: string | null;
  next_run_at: string | null;
}

const ScheduleTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [timeOfDay, setTimeOfDay] = useState('02:00');
  const [backupType, setBackupType] = useState<'full' | 'incremental'>('full');
  const [retentionCount, setRetentionCount] = useState(30);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState('');

  // Fetch existing schedule
  const { data: schedule, isLoading } = useQuery({
    queryKey: ['backup-schedule'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backup_schedules')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows" error
      return data as BackupSchedule | null;
    },
  });

  // Populate form when schedule loads
  useEffect(() => {
    if (schedule) {
      setEnabled(schedule.enabled);
      setFrequency(schedule.frequency);
      setTimeOfDay(schedule.time_of_day.substring(0, 5)); // HH:MM format
      setBackupType(schedule.backup_type);
      setRetentionCount(schedule.retention_count);
      setEmailNotifications(schedule.email_notifications);
      setNotificationEmail(schedule.notification_email || '');
    }
  }, [schedule]);

  // Save schedule mutation
  const saveScheduleMutation = useMutation({
    mutationFn: async () => {
      const scheduleData = {
        enabled,
        frequency,
        time_of_day: `${timeOfDay}:00`,
        backup_type: backupType,
        retention_count: retentionCount,
        email_notifications: emailNotifications,
        notification_email: emailNotifications ? notificationEmail : null,
        updated_at: new Date().toISOString(),
      };

      if (schedule) {
        // Update existing
        const { error } = await supabase
          .from('backup_schedules')
          .update(scheduleData)
          .eq('id', schedule.id);
        
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('backup_schedules')
          .insert(scheduleData);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Schedule saved',
        description: 'Backup schedule has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['backup-schedule'] });
    },
    onError: (error) => {
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Failed to save schedule',
        variant: 'destructive',
      });
    },
  });

  const getNextRunTime = () => {
    if (!enabled) return 'Disabled';
    
    const now = new Date();
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);

    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    if (frequency === 'weekly') {
      const daysUntilMonday = (8 - next.getDay()) % 7 || 7;
      next.setDate(next.getDate() + daysUntilMonday);
    } else if (frequency === 'monthly') {
      next.setMonth(next.getMonth() + 1, 1);
      next.setHours(hours, minutes, 0, 0);
    }

    return next.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Scheduled Backups</h2>
        <p className="text-muted-foreground">
          Configure automated backups to run on a schedule
        </p>
      </div>

      {/* Active Schedule Status Banner */}
      {schedule && enabled && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Active Schedule</AlertTitle>
          <AlertDescription>
            Next backup: {getNextRunTime()}
            {schedule.last_run_at && ` | Last run: ${format(new Date(schedule.last_run_at), 'MMM d, yyyy HH:mm')}`}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <Card className="p-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </Card>
      ) : (
        <>
          {/* Schedule Status */}
          {schedule && (
            <Card className="p-6 bg-muted/50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-semibold">
                    {schedule.enabled ? (
                      <span className="text-green-500">Active</span>
                    ) : (
                      <span className="text-muted-foreground">Inactive</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Run</p>
                  <p className="text-sm font-medium">{getNextRunTime()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Run</p>
                  <p className="text-sm font-medium">
                    {schedule.last_run_at 
                      ? new Date(schedule.last_run_at).toLocaleString()
                      : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Frequency</p>
                  <p className="text-sm font-medium capitalize">{schedule.frequency}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Configuration Form */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Schedule Configuration</h3>
            <div className="space-y-6">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Scheduled Backups</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically create backups on a schedule
                  </p>
                </div>
                <Switch checked={enabled} onCheckedChange={setEnabled} />
              </div>

              {/* Frequency */}
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={frequency}
                  onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setFrequency(value)}
                  disabled={!enabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly (Mondays)</SelectItem>
                    <SelectItem value="monthly">Monthly (1st of month)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Time of Day */}
              <div className="space-y-2">
                <Label>Time of Day</Label>
                <Input
                  type="time"
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  disabled={!enabled}
                />
                <p className="text-xs text-muted-foreground">
                  Server timezone (UTC)
                </p>
              </div>

              {/* Backup Type */}
              <div className="space-y-2">
                <Label>Backup Type</Label>
                <Select
                  value={backupType}
                  onValueChange={(value: 'full' | 'incremental') => setBackupType(value)}
                  disabled={!enabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Backup</SelectItem>
                    <SelectItem value="incremental">Incremental</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Retention */}
              <div className="space-y-2">
                <Label>Retention Policy</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={retentionCount}
                    onChange={(e) => setRetentionCount(parseInt(e.target.value))}
                    disabled={!enabled}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">backups to keep</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Older backups will be automatically deleted
                </p>
              </div>

              {/* Email Notifications */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when backups complete
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                    disabled={!enabled}
                  />
                </div>

                {emailNotifications && (
                  <div className="space-y-2">
                    <Label>Notification Email</Label>
                    <Input
                      type="email"
                      placeholder="admin@example.com"
                      value={notificationEmail}
                      onChange={(e) => setNotificationEmail(e.target.value)}
                      disabled={!enabled}
                    />
                  </div>
                )}
              </div>

              {/* Save Button */}
              <Button
                onClick={() => saveScheduleMutation.mutate()}
                disabled={saveScheduleMutation.isPending}
                className="w-full"
              >
                {saveScheduleMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Schedule
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Info Card */}
          <Card className="p-6 bg-muted/50">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium">About Scheduled Backups</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Backups run automatically at the specified time</li>
                  <li>• Old backups are deleted based on retention policy</li>
                  <li>• Failed backups will retry up to 3 times</li>
                  <li>• You can always create manual backups in addition to scheduled ones</li>
                </ul>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default ScheduleTab;
