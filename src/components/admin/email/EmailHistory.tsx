import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { sanitizeEmailHtml } from '@/lib/sanitize';

interface EmailHistoryProps {
  entityType: string;
  entityId: string;
  limit?: number;
}

const EmailHistory = ({ entityType, entityId, limit = 20 }: EmailHistoryProps) => {
  const { data: emails, isLoading } = useQuery({
    queryKey: ['email-history', entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_queue')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      sent: 'default',
      pending: 'secondary',
      failed: 'destructive'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!emails || emails.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No emails sent yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {emails.map((email) => (
        <Card key={email.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(email.status)}
                <CardTitle className="text-base">{email.subject}</CardTitle>
              </div>
              {getStatusBadge(email.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">To:</span> {email.to_email}
              </div>
              <div>
                <span className="text-muted-foreground">Date:</span>{' '}
                {format(new Date(email.created_at), 'MMM dd, yyyy HH:mm')}
              </div>
              {email.cc_email && (
                <div>
                  <span className="text-muted-foreground">CC:</span> {email.cc_email}
                </div>
              )}
              {email.sent_at && (
                <div>
                  <span className="text-muted-foreground">Sent:</span>{' '}
                  {format(new Date(email.sent_at), 'MMM dd, yyyy HH:mm')}
                </div>
              )}
            </div>
            {email.error_message && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                <strong>Error:</strong> {email.error_message}
              </div>
            )}
            <details className="mt-2">
              <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                View email body
              </summary>
              <div
                className="mt-2 p-3 bg-gray-50 rounded text-sm border"
                dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(email.body) }}
              />
            </details>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default EmailHistory;
