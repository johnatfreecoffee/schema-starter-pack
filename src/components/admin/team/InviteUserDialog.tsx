import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CRUDLogger } from '@/lib/crudLogger';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { callEdgeFunction } from '@/utils/callEdgeFunction';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['admin', 'crm_user'], {
    required_error: 'Please select a role',
  }),
  job_title: z.string().optional(),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function InviteUserDialog({ open, onOpenChange, onSuccess }: InviteUserDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      full_name: '',
      role: 'crm_user',
      job_title: '',
    },
  });

  const onSubmit = async (data: InviteFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check for duplicate email in user_profiles
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', data.email)
        .maybeSingle();

      if (existingProfile) {
        toast({
          title: 'Error',
          description: 'A user with this email already exists',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Check for duplicate email in pending invitations
      const { data: existingInvite } = await supabase
        .from('team_invitations')
        .select('id')
        .eq('email', data.email)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingInvite) {
        toast({
          title: 'Error',
          description: 'A pending invitation already exists for this email',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Call edge function to send invitation
      const inviteData = {
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        job_title: data.job_title,
      };

      await callEdgeFunction({
        name: 'send-team-invitation',
        body: inviteData,
        timeoutMs: 60000,
      });

      // Log the invitation
      await CRUDLogger.logCreate({
        userId: user.id,
        entityType: 'account',
        entityId: crypto.randomUUID(),
        entityName: data.full_name,
        metadata: { action: 'invited', role: data.role },
      });

      toast({
        title: 'Invitation Sent',
        description: `An invitation email has been sent to ${data.email}. They will receive instructions to set up their account.`,
      });

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error inviting user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your team. They will receive an email with instructions to set up their account.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="crm_user">CRM User</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="job_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Sales Manager" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Invitation
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
