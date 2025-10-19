import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { Loader2, Key, Mail } from 'lucide-react';
import { CRUDLogger } from '@/lib/crudLogger';

interface PasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userEmail: string;
  userName: string;
}

export function PasswordResetDialog({
  open,
  onOpenChange,
  userId,
  userEmail,
  userName,
}: PasswordResetDialogProps) {
  const [loading, setLoading] = useState(false);
  const [resetMethod, setResetMethod] = useState<'temp' | 'email'>('email');
  const [tempPassword, setTempPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(password);
    setShowPassword(true);
  };

  const handleResetPassword = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (resetMethod === 'temp') {
        if (!tempPassword) {
          toast({
            title: 'Error',
            description: 'Please generate a temporary password first',
            variant: 'destructive',
          });
          return;
        }

        // Update user's password and set require_password_change flag
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          userId,
          { password: tempPassword }
        );

        if (updateError) throw updateError;

        // Set require_password_change flag
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({ require_password_change: true })
          .eq('id', userId);

        if (profileError) throw profileError;

        await CRUDLogger.logUpdate({
          userId: user.id,
          entityType: 'account',
          entityId: userId,
          entityName: userName,
          changes: {
            action: { old: '', new: 'Password reset (temporary)' },
          },
        });

        toast({
          title: 'Success',
          description: 'Temporary password set. Please save it securely and share with the user.',
        });
      } else {
        // Send password reset email
        const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
          redirectTo: `${window.location.origin}/auth`,
        });

        if (error) throw error;

        await CRUDLogger.logUpdate({
          userId: user.id,
          entityType: 'account',
          entityId: userId,
          entityName: userName,
          changes: {
            action: { old: '', new: 'Password reset email sent' },
          },
        });

        toast({
          title: 'Success',
          description: `Password reset email sent to ${userEmail}`,
        });

        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    toast({
      title: 'Copied',
      description: 'Temporary password copied to clipboard',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Reset the password for {userName} ({userEmail})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={resetMethod} onValueChange={(v) => setResetMethod(v as 'temp' | 'email')}>
            <div className="flex items-center space-x-2 p-4 border rounded-lg">
              <RadioGroupItem value="email" id="email" />
              <Label htmlFor="email" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Send Reset Email</p>
                    <p className="text-sm text-muted-foreground">User will receive an email with a reset link</p>
                  </div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg">
              <RadioGroupItem value="temp" id="temp" />
              <Label htmlFor="temp" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Set Temporary Password</p>
                    <p className="text-sm text-muted-foreground">Generate a password that must be changed on next login</p>
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {resetMethod === 'temp' && (
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={generateTempPassword}
                className="w-full"
              >
                Generate Temporary Password
              </Button>

              {showPassword && tempPassword && (
                <div className="space-y-2">
                  <Label>Temporary Password</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tempPassword}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCopyPassword}
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-sm text-amber-600">
                    ⚠️ Save this password securely. It will not be shown again. The user will be required to change it on next login.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={loading || (resetMethod === 'temp' && !tempPassword)}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {resetMethod === 'temp' ? 'Set Password' : 'Send Reset Email'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
