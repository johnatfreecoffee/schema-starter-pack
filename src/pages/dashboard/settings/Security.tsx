import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Lock, History, Settings as SettingsIcon } from 'lucide-react';
import { securityAudit } from '@/lib/securityAudit';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SecuritySettings {
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_lowercase: boolean;
  password_require_number: boolean;
  password_require_special: boolean;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  session_timeout_minutes: number;
  require_2fa_for_admins: boolean;
  password_reset_expiry_hours: number;
}

export default function Security() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SecuritySettings>({
    password_min_length: 8,
    password_require_uppercase: true,
    password_require_lowercase: true,
    password_require_number: true,
    password_require_special: true,
    max_login_attempts: 5,
    lockout_duration_minutes: 30,
    session_timeout_minutes: 60,
    require_2fa_for_admins: false,
    password_reset_expiry_hours: 24,
  });

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    loadAuditLogs();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('security_settings')
        .select('setting_key, setting_value');

      if (data) {
        const settingsMap: any = {};
        data.forEach(item => {
          settingsMap[item.setting_key] = (item.setting_value as any).value;
        });
        setSettings(settingsMap as SecuritySettings);
      }
    } catch (error) {
      console.error('Failed to load security settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load security settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const { data } = await supabase
        .from('security_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setAuditLogs(data);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update each setting
      const updates = Object.entries(settings).map(([key, value]) =>
        supabase
          .from('security_settings')
          .update({
            setting_value: { value },
            updated_by: user?.id,
            updated_at: new Date().toISOString(),
          })
          .eq('setting_key', key)
      );

      await Promise.all(updates);

      // Log security event
      if (user) {
        await securityAudit.securitySettingChanged(
          user.id,
          'security_settings',
          {},
          settings
        );
      }

      toast({
        title: 'Success',
        description: 'Security settings updated successfully',
      });

      loadAuditLogs(); // Refresh audit logs
    } catch (error) {
      console.error('Failed to save security settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save security settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Security Settings</h1>
          <p className="text-muted-foreground">
            Configure security policies and monitor authentication events
          </p>
        </div>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="settings">
              <SettingsIcon className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="audit">
              <History className="h-4 w-4 mr-2" />
              Audit Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Changes to security settings will affect all users immediately. Use caution when modifying these values.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Password Requirements
                </CardTitle>
                <CardDescription>
                  Configure password complexity requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="min-length">Minimum Password Length</Label>
                  <Input
                    id="min-length"
                    type="number"
                    min="6"
                    max="32"
                    value={settings.password_min_length}
                    onChange={(e) =>
                      setSettings({ ...settings, password_min_length: parseInt(e.target.value) })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="require-uppercase">Require Uppercase Letter</Label>
                  <Switch
                    id="require-uppercase"
                    checked={settings.password_require_uppercase}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, password_require_uppercase: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="require-lowercase">Require Lowercase Letter</Label>
                  <Switch
                    id="require-lowercase"
                    checked={settings.password_require_lowercase}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, password_require_lowercase: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="require-number">Require Number</Label>
                  <Switch
                    id="require-number"
                    checked={settings.password_require_number}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, password_require_number: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="require-special">Require Special Character</Label>
                  <Switch
                    id="require-special"
                    checked={settings.password_require_special}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, password_require_special: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Login Security</CardTitle>
                <CardDescription>
                  Configure account lockout and authentication policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="max-attempts">Maximum Failed Login Attempts</Label>
                  <Input
                    id="max-attempts"
                    type="number"
                    min="3"
                    max="10"
                    value={settings.max_login_attempts}
                    onChange={(e) =>
                      setSettings({ ...settings, max_login_attempts: parseInt(e.target.value) })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lockout-duration">Lockout Duration (minutes)</Label>
                  <Input
                    id="lockout-duration"
                    type="number"
                    min="5"
                    max="120"
                    value={settings.lockout_duration_minutes}
                    onChange={(e) =>
                      setSettings({ ...settings, lockout_duration_minutes: parseInt(e.target.value) })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="require-2fa">Require 2FA for Admins</Label>
                    <p className="text-sm text-muted-foreground">
                      Force all admin users to enable two-factor authentication
                    </p>
                  </div>
                  <Switch
                    id="require-2fa"
                    checked={settings.require_2fa_for_admins}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, require_2fa_for_admins: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Session Management</CardTitle>
                <CardDescription>
                  Configure session timeout and password reset policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    min="15"
                    max="480"
                    value={settings.session_timeout_minutes}
                    onChange={(e) =>
                      setSettings({ ...settings, session_timeout_minutes: parseInt(e.target.value) })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reset-expiry">Password Reset Expiry (hours)</Label>
                  <Input
                    id="reset-expiry"
                    type="number"
                    min="1"
                    max="72"
                    value={settings.password_reset_expiry_hours}
                    onChange={(e) =>
                      setSettings({ ...settings, password_reset_expiry_hours: parseInt(e.target.value) })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Security Settings'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Security Audit Logs</CardTitle>
                <CardDescription>
                  Recent security events and authentication activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : auditLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No audit logs yet</p>
                ) : (
                  <div className="space-y-2">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start justify-between p-3 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{log.event_type.replace(/_/g, ' ')}</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                log.severity === 'critical'
                                  ? 'bg-red-100 text-red-800'
                                  : log.severity === 'warning'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {log.severity}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {log.ip_address && `IP: ${log.ip_address}`}
                          </p>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
