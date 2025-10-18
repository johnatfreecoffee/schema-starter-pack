import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Mail, Loader2 } from 'lucide-react';

const EmailSettings = () => {
  const queryClient = useQueryClient();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    email_from_address: '',
    email_from_name: '',
    email_reply_to: '',
    email_signature: '',
    email_notifications_enabled: true
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        email_from_address: settings.email_from_address || settings.email || '',
        email_from_name: settings.email_from_name || settings.business_name || '',
        email_reply_to: settings.email_reply_to || settings.email || '',
        email_signature: settings.email_signature || '',
        email_notifications_enabled: settings.email_notifications_enabled ?? true
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (dataToSave: any) => {
      const { error } = await supabase
        .from('company_settings')
        .update(dataToSave)
        .eq('id', settings?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      setIsSaving(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save settings');
      setIsSaving(false);
    }
  });

  const autoSave = useCallback((data: any) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(() => {
      saveMutation.mutate(data);
    }, 1000);
  }, [saveMutation]);

  const handleFieldChange = useCallback((field: string, value: any) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    autoSave(updatedData);
  }, [formData, autoSave]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Email Settings</h1>
          </div>
          <p className="text-muted-foreground">
            Configure your email settings and signature
          </p>
          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Email Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Set default email addresses and sender information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="from-email">Default "From" Email Address *</Label>
                <Input
                  id="from-email"
                  type="email"
                  value={formData.email_from_address}
                  onChange={(e) => handleFieldChange('email_from_address', e.target.value)}
                  placeholder="noreply@yourdomain.com"
                />
                <p className="text-xs text-muted-foreground">
                  This email address will be used as the sender for all outgoing emails
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="from-name">Default "From" Name *</Label>
                <Input
                  id="from-name"
                  value={formData.email_from_name}
                  onChange={(e) => handleFieldChange('email_from_name', e.target.value)}
                  placeholder="Your Company Name"
                />
                <p className="text-xs text-muted-foreground">
                  This name will appear as the sender name in recipient inboxes
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reply-to">Reply-To Email Address</Label>
                <Input
                  id="reply-to"
                  type="email"
                  value={formData.email_reply_to}
                  onChange={(e) => handleFieldChange('email_reply_to', e.target.value)}
                  placeholder="support@yourdomain.com"
                />
                <p className="text-xs text-muted-foreground">
                  When recipients reply to your emails, responses will go to this address
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Turn on/off all automated email notifications globally
                  </p>
                </div>
                <Switch
                  checked={formData.email_notifications_enabled}
                  onCheckedChange={(checked) => handleFieldChange('email_notifications_enabled', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Email Signature */}
          <Card>
            <CardHeader>
              <CardTitle>Email Signature</CardTitle>
              <CardDescription>
                This signature will be automatically appended to all outgoing emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="signature">Global Email Signature</Label>
              <Textarea
                id="signature"
                value={formData.email_signature}
                onChange={(e) => handleFieldChange('email_signature', e.target.value)}
                placeholder={`Best regards,\n\nYour Company Name\nPhone: (555) 555-5555\nEmail: info@yourcompany.com\nWebsite: www.yourcompany.com`}
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use plain text for best compatibility across email clients
              </p>
            </CardContent>
          </Card>

          {/* SMTP Settings */}
          <Card>
            <CardHeader>
              <CardTitle>SMTP Settings</CardTitle>
              <CardDescription>
                Email delivery configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Using Lovable Cloud email service. SMTP configuration coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EmailSettings;