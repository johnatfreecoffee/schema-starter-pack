import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import CustomerLayout from '@/components/layout/CustomerLayout';
import { Loader2, Mail, Phone, MapPin, Shield, CheckCircle2 } from 'lucide-react';
import { TwoFactorSetup } from '@/components/customer/TwoFactorSetup';
import { generateBackupCodes, hashBackupCodes, downloadBackupCodes } from '@/lib/twoFactor';

const CustomerProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [account, setAccount] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [twoFactorSetupOpen, setTwoFactorSetupOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      setUserProfile(profileData);

      // Get account
      const { data: accountData } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (accountData) {
        setAccount(accountData);

        // Get contacts
        const { data: contactsData } = await supabase
          .from('contacts')
          .select('*')
          .eq('account_id', accountData.id);

        setContacts(contactsData || []);

        // Get addresses
        const { data: addressesData } = await supabase
          .from('addresses')
          .select('*')
          .eq('account_id', accountData.id);

        setAddresses(addressesData || []);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('user_profiles')
        .update({
          two_factor_enabled: false,
          two_factor_secret: null,
          two_factor_backup_codes: null,
          two_factor_enabled_at: null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Two-factor authentication disabled');
      fetchProfileData();
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast.error('Failed to disable two-factor authentication');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!confirm('This will invalidate all existing backup codes. Are you sure?')) {
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const codes = generateBackupCodes();
      const hashedCodes = await hashBackupCodes(codes);

      const { error } = await supabase
        .from('user_profiles')
        .update({
          two_factor_backup_codes: JSON.stringify(hashedCodes),
        })
        .eq('id', user.id);

      if (error) throw error;

      downloadBackupCodes(codes, userProfile?.email || user.email || '');
      toast.success('New backup codes generated and downloaded');
      fetchProfileData();
    } catch (error) {
      console.error('Error regenerating backup codes:', error);
      toast.error('Failed to regenerate backup codes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </CustomerLayout>
    );
  }

  const primaryContact = contacts.find(c => c.is_primary) || contacts[0];
  const primaryAddress = addresses.find(a => a.is_primary) || addresses[0];

  const backupCodesCount = userProfile?.two_factor_backup_codes 
    ? JSON.parse(userProfile.two_factor_backup_codes).length 
    : 0;

  return (
    <CustomerLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-1">View and manage your account information</p>
        </div>

        <Tabs defaultValue="account" className="w-full">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6 mt-6">

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your company account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Company Name</Label>
                <p className="font-medium">{account?.account_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Account Status</Label>
                <p className="font-medium capitalize">{account?.status || 'Active'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Industry</Label>
                <p className="font-medium">{account?.industry || 'Not specified'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Website</Label>
                <p className="font-medium">{account?.website || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        {primaryContact && (
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Primary contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">
                    {primaryContact.first_name} {primaryContact.last_name}
                  </p>
                </div>
                {primaryContact.title && (
                  <div>
                    <Label className="text-muted-foreground">Title</Label>
                    <p className="font-medium">{primaryContact.title}</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-muted-foreground text-xs">Email</Label>
                    <p className="font-medium">{primaryContact.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-muted-foreground text-xs">Phone</Label>
                    <p className="font-medium">{primaryContact.phone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Address Information */}
        {primaryAddress && (
          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
              <CardDescription>Primary service address</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium">{primaryAddress.street_address}</p>
                  {primaryAddress.unit && <p className="text-sm">{primaryAddress.unit}</p>}
                  <p className="text-sm">
                    {primaryAddress.city}, {primaryAddress.state} {primaryAddress.zip}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6 mt-6">
            {/* Two-Factor Authentication */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Two-Factor Authentication
                  {userProfile?.two_factor_enabled && (
                    <Badge variant="default" className="ml-2">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Enabled
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!userProfile?.two_factor_enabled ? (
                  <>
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        Two-factor authentication (2FA) adds an extra layer of security by requiring a code from your phone in addition to your password.
                      </AlertDescription>
                    </Alert>
                    <Button onClick={() => setTwoFactorSetupOpen(true)}>
                      Enable Two-Factor Authentication
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">Two-Factor Authentication is enabled</p>
                        <p className="text-sm text-muted-foreground">
                          Enabled on {new Date(userProfile.two_factor_enabled_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Backup codes remaining: {backupCodesCount}
                        </p>
                      </div>
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleRegenerateBackupCodes}
                        disabled={saving}
                      >
                        Regenerate Backup Codes
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDisable2FA}
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Disabling...
                          </>
                        ) : (
                          'Disable 2FA'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <TwoFactorSetup
        open={twoFactorSetupOpen}
        onOpenChange={setTwoFactorSetupOpen}
        onSuccess={fetchProfileData}
        userEmail={userProfile?.email || ''}
      />
    </CustomerLayout>
  );
};

export default CustomerProfile;
