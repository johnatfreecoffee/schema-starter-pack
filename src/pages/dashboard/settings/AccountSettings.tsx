import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { User, Mail, Lock, Loader2, Edit, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  const [changeEmailOpen, setChangeEmailOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    avatarUrl: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Email Change Dialog State
  const [emailData, setEmailData] = useState({
    currentEmail: '',
    newEmail: '',
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
        firstName: profileData?.first_name || '',
        lastName: profileData?.last_name || '',
        phone: profileData?.phone || '',
        avatarUrl: profileData?.avatar_url || '',
      });
      setAvatarPreview(profileData?.avatar_url || '');
      setEmailData({
        currentEmail: currentUser.email || '',
        newEmail: '',
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!profileData.firstName.trim()) {
      toast.error('First name is required');
      return;
    }
    if (!profileData.lastName.trim()) {
      toast.error('Last name is required');
      return;
    }
    if (!profileData.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }
    
    setSaving(true);

    try {
      if (!user) return;

      let avatarUrl = profileData.avatarUrl;

      // Upload new avatar if file selected
      if (avatarFile) {
        // Delete old avatar if exists
        if (profileData.avatarUrl) {
          const oldPath = profileData.avatarUrl.split('/').pop();
          if (oldPath) {
            await supabase.storage.from('avatars').remove([`${user.id}/${oldPath}`]);
          }
        }

        // Upload new avatar
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        avatarUrl = publicUrl;
      }

      // Update profile information
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ 
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          phone: profileData.phone,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast.success('Profile updated successfully');
      setUpdateProfileOpen(false);
      setAvatarFile(null);
      await fetchUserData();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!user) return;

      if (!emailData.newEmail || emailData.newEmail === emailData.currentEmail) {
        toast.error('Please enter a new email address');
        return;
      }

      // Trigger email verification flow
      const { error: emailError } = await supabase.functions.invoke('send-email-verification', {
        body: { newEmail: emailData.newEmail }
      });

      if (emailError) throw emailError;

      toast.success('Verification email sent! Please check your new email to complete the change.');
      setChangeEmailOpen(false);
      setEmailData({ ...emailData, newEmail: '' });
    } catch (error: any) {
      console.error('Error changing email:', error);
      toast.error(error.message || 'Failed to send verification email');
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

  const initials = `${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

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
                <p className="text-lg font-medium">
                  {profile?.first_name} {profile?.last_name}
                </p>
              </div>
              
              <div>
                <Label className="text-muted-foreground text-sm">Email</Label>
                <p className="text-lg">{user?.email}</p>
              </div>
              
              {profile?.phone && (
                <div>
                  <Label className="text-muted-foreground text-sm">Phone</Label>
                  <p className="text-lg">{profile.phone}</p>
                </div>
              )}
              
              <div className="flex flex-wrap gap-3 pt-2">
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
                        Update your personal information and profile picture.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                      <div className="flex flex-col items-center gap-4">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src={avatarPreview || profileData.avatarUrl} />
                          <AvatarFallback className="text-2xl">
                            {profileData.firstName?.[0]}{profileData.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={saving}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Photo
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG or GIF. Max 2MB.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="firstName">
                            First Name <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="firstName"
                            value={profileData.firstName}
                            onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                            placeholder="First name"
                            disabled={saving}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="lastName">
                            Last Name <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="lastName"
                            value={profileData.lastName}
                            onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                            placeholder="Last name"
                            disabled={saving}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="phone">
                          Phone Number <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Enter your phone number"
                          disabled={saving}
                          required
                        />
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

                <Dialog open={changeEmailOpen} onOpenChange={setChangeEmailOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Mail className="h-4 w-4 mr-2" />
                      Change Email Address
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl">Change Email Address</DialogTitle>
                      <DialogDescription className="text-base">
                        For security purposes, we'll send a verification link to your new email address.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEmailChange} className="space-y-6">
                      <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Current Email</Label>
                          <p className="text-base font-medium mt-1">{emailData.currentEmail}</p>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="newEmail">New Email Address</Label>
                          <Input
                            id="newEmail"
                            type="email"
                            value={emailData.newEmail}
                            onChange={(e) => setEmailData(prev => ({ ...prev, newEmail: e.target.value }))}
                            placeholder="Enter new email address"
                            disabled={saving}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-4">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                          <strong>Important:</strong> You'll receive a verification email at your new address. 
                          Click the link in that email to complete the change. Your current email will remain 
                          active until verification is complete.
                        </p>
                      </div>
                      
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setChangeEmailOpen(false)}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                          {saving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            'Send Verification Email'
                          )}
                        </Button>
                      </DialogFooter>
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
