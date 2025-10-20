import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TicketPriorityBadge } from '@/components/admin/tickets/TicketPriorityBadge';
import { TicketStatusBadge } from '@/components/admin/tickets/TicketStatusBadge';
import { TicketConversation } from '@/components/admin/tickets/TicketConversation';
import { TicketReplyForm } from '@/components/admin/tickets/TicketReplyForm';
import { ArrowLeft, User, Clock, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          account:accounts(account_name, id),
          project:projects(project_name, id),
          invoice:invoices(invoice_number, id)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;

      // Mark as read by agent
      await supabase
        .from('tickets')
        .update({ unread_by_agent: false })
        .eq('id', id);

      return data;
    }
  });

  const { data: messages } = useQuery({
    queryKey: ['ticket-messages', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: users } = useQuery({
    queryKey: ['crm-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, roles(name)')
        .in('roles.name', ['Admin','Super Admin','CRM User','Sales Manager','Technician','Office Staff','Read-Only User']);
      
      if (error) throw error;
      return data || [];
    }
  });

  const updateTicket = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast({ title: 'Ticket updated successfully' });
    }
  });

  const sendReply = useMutation({
    mutationFn: async ({ message, isInternalNote, attachments }: { message: string; isInternalNote: boolean; attachments: string[] }) => {
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: id,
          sender_id: currentUser?.id,
          message,
          is_internal_note: isInternalNote,
          attachments: attachments.length > 0 ? attachments : null
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', id] });
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      toast({ title: 'Reply sent successfully' });
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container mx-auto p-6">
        <p>Ticket not found</p>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto p-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/tickets')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tickets
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-sm text-muted-foreground">
                      {ticket.ticket_number}
                    </span>
                    <TicketPriorityBadge priority={ticket.priority} />
                    <TicketStatusBadge status={ticket.status} />
                  </div>
                  <h1 className="text-2xl font-bold">{ticket.subject}</h1>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
                <span>Created {format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}</span>
                {ticket.last_message_at && (
                  <>
                    <span>•</span>
                    <span>Last updated {format(new Date(ticket.last_message_at), 'MMM d, h:mm a')}</span>
                  </>
                )}
              </div>

              <div className="space-y-6">
                {messages && <TicketConversation messages={messages} currentUserEmail={currentUser?.email} />}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Reply</h3>
              <TicketReplyForm
                onSubmit={(message, isInternalNote, attachments) => 
                  sendReply.mutateAsync({ message, isInternalNote, attachments })
                }
                isSubmitting={sendReply.isPending}
                customerName={ticket.account.account_name}
                ticketNumber={ticket.ticket_number}
              />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Ticket Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Status</label>
                  <Select
                    value={ticket.status}
                    onValueChange={(value) => updateTicket.mutate({ status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Priority</label>
                  <Select
                    value={ticket.priority}
                    onValueChange={(value) => updateTicket.mutate({ priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Assigned To</label>
                  <Select
                    value={ticket.assigned_to || 'unassigned'}
                    onValueChange={(value) => 
                      updateTicket.mutate({ assigned_to: value === 'unassigned' ? null : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users?.map((user) => (
                        <SelectItem key={user.user_id} value={user.user_id}>
                          {user.user_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Category
                  </label>
                  <p className="capitalize">{ticket.category}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer
              </h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium">{ticket.account.account_name}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/dashboard/accounts/${ticket.account.id}`)}
                  className="w-full mt-2"
                >
                  View Account
                </Button>
              </div>
            </Card>

            {(ticket.project || ticket.invoice) && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Related Items</h3>
                <div className="space-y-2 text-sm">
                  {ticket.project && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/dashboard/projects/${ticket.project.id}`)}
                      className="w-full"
                    >
                      Project: {ticket.project.project_name}
                    </Button>
                  )}
                  {ticket.invoice && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/dashboard/money/invoices/${ticket.invoice.id}`)}
                      className="w-full"
                    >
                      Invoice: {ticket.invoice.invoice_number}
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
