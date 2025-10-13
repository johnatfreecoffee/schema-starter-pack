import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Upload, Mail, Loader2 } from 'lucide-react';
import { UserRoleBadge } from './UserRoleBadge';
import { UserStatusBadge } from './UserStatusBadge';
import { PermissionsMatrix } from './PermissionsMatrix';
import { CRUDLogger } from '@/lib/crudLogger';
import { formatDistanceToNow } from 'date-fns';

interface UserDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  onSuccess: () => void;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  job_title: string | null;
  status: 'active' | 'suspended';
  last_login_at: string | null;
  created_at: string;
}

interface UserRole {
  role: 'admin' | 'crm_user' | 'customer';
}

export function UserDetailDialog({ open, onOpenChange, userId, onSuccess }: UserDetailDialogProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<'admin' | 'crm_user' | 'customer'>('crm_user');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (open && userId) {
      loadUserData();
    }
  }, [open, userId]);

  const loadUserData = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Load role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role_id, roles(name)')
        .eq('user_id', userId)
        .single();

      if (roleError) throw roleError;

      setProfile(profileData as UserProfile);
      setRole((roleData as any)?.roles?.name || 'customer');
    } catch (error: any) {
      console.error('Error loading user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);

      toast({
        title: 'Success',
        description: 'Avatar uploaded successfully',
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload avatar',
        variant: 'destructive',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId || !profile) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const formData = new FormData(e.currentTarget);
      const updates = {
        full_name: formData.get('full_name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        job_title: formData.get('job_title') as string,
        status: formData.get('status') as 'active' | 'suspended',
      };

      // Calculate changes for logging
      const changes = CRUDLogger.calculateChanges(profile, updates);

      // Update profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId);

      if (profileError) throw profileError;

      // Update role if changed
      const newRole = formData.get('role') as string;
      if (newRole !== role) {
        // Get the role ID for the selected role name
        const { data: newRoleData } = await supabase
          .from('roles')
          .select('id')
          .eq('name', newRole)
          .single();

        if (newRoleData) {
          // Delete existing role
          await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', userId);

          // Insert new role
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: userId,
              role_id: newRoleData.id
            });

          if (roleError) throw roleError;

          changes['role'] = { old: role, new: newRole };
        }
      }

      // Log the update
      await CRUDLogger.logUpdate({
        userId: user.id,
        entityType: 'account',
        entityId: userId,
        entityName: updates.full_name,
        changes,
      });

      toast({
        title: 'Success',
        description: 'User updated successfully',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast({
        title: 'Error',
        description: 'Failed to save user',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResendInvitation = async () => {
    if (!profile) return;

    setResending(true);
    try {
      // Call edge function to resend invitation
      const { error } = await supabase.functions.invoke('send-team-invitation', {
        body: {
          email: profile.email,
          full_name: profile.full_name,
          resend: true,
        },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Invitation resent successfully',
      });
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to resend invitation',
        variant: 'destructive',
      });
    } finally {
      setResending(false);
    }
  };

  if (!open || !userId) return null;

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <form onSubmit={handleSave} className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback>
                    {profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingAvatar}
                      asChild
                    >
                      <span>
                        {uploadingAvatar ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        Upload Avatar
                      </span>
                    </Button>
                  </Label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  defaultValue={profile.full_name}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={profile.email}
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={profile.phone || ''}
                />
              </div>

              {/* Job Title */}
              <div className="space-y-2">
                <Label htmlFor="job_title">Job Title</Label>
                <Input
                  id="job_title"
                  name="job_title"
                  defaultValue={profile.job_title || ''}
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue={role}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="crm_user">CRM User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={profile.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Info */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>
                  Created: {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                </div>
                {profile.last_login_at && (
                  <div>
                    Last login: {formatDistanceToNow(new Date(profile.last_login_at), { addSuffix: true })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendInvitation}
                  disabled={resending || profile.status !== 'active'}
                >
                  {resending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Resend Invitation
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="permissions">
            <PermissionsMatrix userId={userId} userRole={role} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
