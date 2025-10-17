import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { sanitizeEmailHtml } from '@/lib/sanitize';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw, Mail, CheckCircle, XCircle, Clock, RotateCcw, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { EmailService } from '@/services/emailService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const EmailQueue = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: emails, isLoading } = useQuery({
    queryKey: ['email-queue', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('email_queue')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['email-stats'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: todayEmails, error: todayError } = await supabase
        .from('email_queue')
        .select('status')
        .gte('created_at', today.toISOString());

      if (todayError) throw todayError;

      const sent = todayEmails?.filter(e => e.status === 'sent').length || 0;
      const pending = todayEmails?.filter(e => e.status === 'pending').length || 0;
      const failed = todayEmails?.filter(e => e.status === 'failed').length || 0;

      return {
        totalToday: todayEmails?.length || 0,
        sent,
        pending,
        failed,
        successRate: sent > 0 ? ((sent / (sent + failed)) * 100).toFixed(1) : '0'
      };
    }
  });

  const processQueueMutation = useMutation({
    mutationFn: async () => {
      await EmailService.processEmailQueue();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-queue'] });
      queryClient.invalidateQueries({ queryKey: ['email-stats'] });
      toast.success('Email queue processed successfully');
    }
  });

  const retryMutation = useMutation({
    mutationFn: async (emailId: string) => {
      return await EmailService.retryEmail(emailId);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['email-queue'] });
        toast.success('Email queued for retry');
      } else {
        toast.error(result.error || 'Failed to retry email');
      }
    }
  });

  const filteredEmails = emails?.filter(email =>
    email.to_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Email Queue</h1>
          <Button
            onClick={() => processQueueMutation.mutate()}
            disabled={processQueueMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${processQueueMutation.isPending ? 'animate-spin' : ''}`} />
            Process Queue
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalToday || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.sent || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.successRate || 0}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Input
                placeholder="Search by recipient or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Email Queue Table */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredEmails && filteredEmails.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmails.map((email) => (
                    <TableRow key={email.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(email.status)}
                          {getStatusBadge(email.status)}
                        </div>
                      </TableCell>
                      <TableCell>{email.to_email}</TableCell>
                      <TableCell className="max-w-xs truncate">{email.subject}</TableCell>
                      <TableCell>
                        {format(new Date(email.created_at), 'MMM dd, HH:mm')}
                      </TableCell>
                      <TableCell>
                        {email.sent_at ? format(new Date(email.sent_at), 'MMM dd, HH:mm') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedEmail(email)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {email.status === 'failed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => retryMutation.mutate(email.id)}
                              disabled={retryMutation.isPending}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No emails found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Email Detail Dialog */}
      <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Details</DialogTitle>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">To:</span> {selectedEmail.to_email}
                </div>
                <div>
                  <span className="font-semibold">Status:</span> {getStatusBadge(selectedEmail.status)}
                </div>
                {selectedEmail.cc_email && (
                  <div>
                    <span className="font-semibold">CC:</span> {selectedEmail.cc_email}
                  </div>
                )}
                <div>
                  <span className="font-semibold">Created:</span>{' '}
                  {format(new Date(selectedEmail.created_at), 'MMM dd, yyyy HH:mm')}
                </div>
              </div>
              <div>
                <span className="font-semibold">Subject:</span> {selectedEmail.subject}
              </div>
              {selectedEmail.error_message && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                  <strong>Error:</strong> {selectedEmail.error_message}
                </div>
              )}
              <div>
                <span className="font-semibold block mb-2">Body:</span>
                <div
                  className="p-4 bg-gray-50 border rounded max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(selectedEmail.body) }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default EmailQueue;
