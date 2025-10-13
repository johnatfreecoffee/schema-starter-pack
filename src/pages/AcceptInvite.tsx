import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, UserCheck, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const acceptInviteSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type AcceptInviteFormData = z.infer<typeof acceptInviteSchema>;

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AcceptInviteFormData>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
      full_name: '',
      phone: '',
    },
  });

  useEffect(() => {
    verifyInvitation();
  }, []);

  const verifyInvitation = async () => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Invalid invitation link');
      setVerifying(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('invite_token', token)
        .eq('status', 'pending')
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('Invitation not found or has already been used');
        setVerifying(false);
        return;
      }

      // Check if invitation has expired
      if (new Date(data.invite_expires_at) < new Date()) {
        setError('This invitation has expired');
        setVerifying(false);
        return;
      }

      setInvitation(data);
      form.setValue('full_name', data.full_name);
    } catch (error: any) {
      console.error('Error verifying invitation:', error);
      setError('Failed to verify invitation');
    } finally {
      setVerifying(false);
    }
  };

  const onSubmit = async (data: AcceptInviteFormData) => {
    if (!invitation) return;

    setLoading(true);
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone,
          job_title: invitation.job_title,
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      // Assign role
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', invitation.role)
        .single();

      if (roleData) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role_id: roleData.id
          });

        if (roleError) throw roleError;
      }

      // Mark invitation as accepted
      const { error: inviteError } = await supabase
        .from('team_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      if (inviteError) throw inviteError;

      toast({
        title: 'Welcome!',
        description: 'Your account has been created successfully',
      });

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept invitation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Verifying invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Invalid Invitation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button
              className="w-full mt-4"
              onClick={() => navigate('/')}
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="h-6 w-6 text-primary" />
            <CardTitle>Accept Invitation</CardTitle>
          </div>
          <CardDescription>
            You've been invited to join as a {invitation?.role === 'admin' ? 'Admin' : 'CRM User'}.
            Complete your profile to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvite;
