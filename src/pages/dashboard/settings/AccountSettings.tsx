import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { User, Mail, Lock, Loader2, Edit } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function AccountSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  
  // Update Profile Dialog State
  const [updateProfileOpen, setUpdateProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
  });
  
  // Change Password Dialog State
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      setUser(currentUser);

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      setProfile(profileData);
      setProfileData({
        fullName: profileData?.full_name || '',
        email: currentUser.email || '',
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Update full name in user_profiles
      if (profileData.fullName !== profile?.full_name) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({ full_name: profileData.fullName })
          .eq('id', user.id);

        if (profileError) throw profileError;
      }

      // Update email if changed
      if (profileData.email !== user.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(profileData.email)) {
          toast.error('Please enter a valid email address');
          setSaving(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke('send-email-verification', {
          body: { newEmail: profileData.email }
        });

        if (error) throw error;

        if (data.success) {
          toast.success(
            'Profile updated! Verification email sent for email change.',
            { duration: 6000 }
          );
        } else {
          throw new Error(data.error || 'Failed to send verification email');
        }
      } else {
        toast.success('Profile updated successfully');
      }

      setUpdateProfileOpen(false);
      await fetchUserData();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = profile?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your profile and security settings
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div>
                <Label className="text-muted-foreground text-sm">Name</Label>
                <p className="text-lg font-medium">{profile?.full_name || 'Not set'}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground text-sm">Email</Label>
                <p className="text-lg">{user?.email}</p>
              </div>
              
              <div className="flex gap-3 pt-2">
                <Dialog open={updateProfileOpen} onOpenChange={setUpdateProfileOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default">
                      <Edit className="h-4 w-4 mr-2" />
                      Update Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Profile</DialogTitle>
                      <DialogDescription>
                        Update your profile information. Email changes require verification.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={profileData.fullName}
                          onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                          disabled={saving}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                          disabled={saving}
                        />
                        {profileData.email !== user?.email && (
                          <p className="text-xs text-muted-foreground">
                            You'll receive a verification email at the new address
                          </p>
                        )}
                      </div>
                      
                      <div className="flex justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setUpdateProfileOpen(false)}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                          {saving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Lock className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>
                        Enter a new password for your account
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          placeholder="Enter new password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          disabled={saving}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm new password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          disabled={saving}
                        />
                      </div>
                      
                      <div className="flex justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setChangePasswordOpen(false)}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={saving || !passwordData.newPassword || !passwordData.confirmPassword}
                        >
                          {saving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            'Update Password'
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
