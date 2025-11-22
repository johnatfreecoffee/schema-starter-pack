import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-email-change', {
          body: { token }
        });

        if (error) throw error;

        if (data.success) {
          // Refresh the user's session to get the updated email
          await supabase.auth.refreshSession();
          
          setStatus('success');
          setMessage('Your email has been successfully updated!');
          setNewEmail(data.newEmail);
          toast.success('Email updated successfully');
        } else {
          throw new Error(data.error || 'Verification failed');
        }
      } catch (error: any) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to verify email. The link may be invalid or expired.');
        toast.error('Email verification failed');
      }
    };

    verifyToken();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
            {status === 'error' && <XCircle className="h-5 w-5 text-destructive" />}
            Email Verification
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Verifying your email address...'}
            {status === 'success' && 'Verification Complete'}
            {status === 'error' && 'Verification Failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            {message}
          </p>
          
          {status === 'success' && newEmail && (
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-md border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Your new email address: <span className="font-bold">{newEmail}</span>
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {status === 'success' && (
              <Button onClick={() => navigate('/dashboard')} className="flex-1">
                Go to Dashboard
              </Button>
            )}
            {status === 'error' && (
              <>
                <Button onClick={() => navigate('/dashboard/settings/account')} className="flex-1">
                  Try Again
                </Button>
                <Button onClick={() => navigate('/dashboard')} variant="outline" className="flex-1">
                  Go to Dashboard
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
