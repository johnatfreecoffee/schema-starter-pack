import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { TwoFactorVerification } from '@/components/customer/TwoFactorVerification';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = loginSchema.extend({
  confirmPassword: z.string(),
  companyName: z.string().min(2, 'Company name is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const CustomerAuth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '',
    companyName: ''
  });
  const [require2FA, setRequire2FA] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<{
    userId: string;
    secret: string;
    backupCodes: string[];
  } | null>(null);

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Check if user has customer role
        supabase
          .from('user_roles')
          .select('role_id, roles(name)')
          .eq('user_id', session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            if ((data as any)?.roles?.name === 'customer') {
              navigate('/customer/dashboard');
            }
          });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data } = await supabase
          .from('user_roles')
          .select('role_id, roles(name)')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if ((data as any)?.roles?.name === 'customer') {
          navigate('/customer/dashboard');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      loginSchema.parse(loginData);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) throw error;

      // Verify user has customer role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role_id, roles(name)')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if ((roleData as any)?.roles?.name !== 'customer') {
        await supabase.auth.signOut();
        throw new Error('Invalid credentials for customer portal');
      }

      // Check if 2FA is enabled
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('two_factor_enabled, two_factor_secret, two_factor_backup_codes')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileData?.two_factor_enabled && profileData.two_factor_secret) {
        // Sign out temporarily and require 2FA
        await supabase.auth.signOut();
        setRequire2FA(true);
        setTwoFactorData({
          userId: data.user.id,
          secret: profileData.two_factor_secret,
          backupCodes: profileData.two_factor_backup_codes 
            ? JSON.parse(profileData.two_factor_backup_codes) 
            : [],
        });
        setLoading(false);
        return;
      }

      // Update last login
      const { data: accountData } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (accountData) {
        await supabase
          .from('accounts')
          .update({ portal_last_login: new Date().toISOString() })
          .eq('id', accountData.id);
      }

      toast.success('Welcome back!');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASuccess = async () => {
    try {
      // Re-authenticate with original credentials after 2FA success
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) throw error;

      // Update last login
      const { data: accountData } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (accountData) {
        await supabase
          .from('accounts')
          .update({ portal_last_login: new Date().toISOString() })
          .eq('id', accountData.id);
      }

      toast.success('Welcome back!');
      setRequire2FA(false);
      setTwoFactorData(null);
      navigate('/customer/dashboard');
    } catch (error: any) {
      console.error('Post-2FA login error:', error);
      toast.error('Authentication failed');
      setRequire2FA(false);
      setTwoFactorData(null);
    }
  };

  const handle2FACancel = () => {
    setRequire2FA(false);
    setTwoFactorData(null);
    setLoginData({ email: '', password: '' });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      signupSchema.parse(signupData);

      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/customer/dashboard`,
        },
      });

      if (error) throw error;

      if (data.user) {
        // Get customer role ID
        const { data: customerRole } = await supabase
          .from('roles')
          .select('id')
          .eq('name', 'customer')
          .single();

        if (customerRole) {
          // Create customer role
          await supabase
            .from('user_roles')
            .insert({ user_id: data.user.id, role_id: customerRole.id });
        }

        // Create account for the customer
        await supabase
          .from('accounts')
          .insert({
            account_name: signupData.companyName,
            user_id: data.user.id,
            portal_enabled: true,
            status: 'active',
          });

        toast.success('Account created successfully! Please check your email to verify your account.');
        setSignupData({ email: '', password: '', confirmPassword: '', companyName: '' });
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || 'Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  };

  if (require2FA && twoFactorData) {
    return (
      <TwoFactorVerification
        userId={twoFactorData.userId}
        encryptedSecret={twoFactorData.secret}
        hashedBackupCodes={twoFactorData.backupCodes}
        onSuccess={handle2FASuccess}
        onCancel={handle2FACancel}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Customer Portal</CardTitle>
          <CardDescription className="text-center">
            Access your account information, projects, and invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-company">Company Name</Label>
                  <Input
                    id="signup-company"
                    type="text"
                    placeholder="Your Company Name"
                    value={signupData.companyName}
                    onChange={(e) => setSignupData({ ...signupData, companyName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerAuth;
