import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import CustomerLayout from '@/components/layout/CustomerLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TicketPriorityBadge } from '@/components/admin/tickets/TicketPriorityBadge';
import { TicketStatusBadge } from '@/components/admin/tickets/TicketStatusBadge';
import { TicketConversation } from '@/components/admin/tickets/TicketConversation';
import { ArrowLeft, Send } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function CustomerTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [replyMessage, setReplyMessage] = useState('');

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['customer-ticket', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;

      // Mark as read by customer
      await supabase
        .from('tickets')
        .update({ unread_by_customer: false })
        .eq('id', id);

      return data;
    }
  });

  const { data: messages } = useQuery({
    queryKey: ['customer-ticket-messages', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', id)
        .eq('is_internal_note', false)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const sendReply = useMutation({
    mutationFn: async (message: string) => {
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: id,
          sender_id: currentUser?.id,
          message,
          is_internal_note: false
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-ticket-messages', id] });
      queryClient.invalidateQueries({ queryKey: ['customer-ticket', id] });
      toast({ title: 'Reply sent successfully' });
      setReplyMessage('');
    }
  });

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyMessage.trim()) {
      sendReply.mutate(replyMessage);
    }
  };

  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="container mx-auto p-6">
          <p>Loading...</p>
        </div>
      </CustomerLayout>
    );
  }

  if (!ticket) {
    return (
      <CustomerLayout>
        <div className="container mx-auto p-6">
          <p>Ticket not found</p>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/customer/support')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Support
        </Button>

        <Card className="p-6 mb-6">
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
            <span>Created {format(new Date(ticket.created_at), 'MMM d, yyyy')}</span>
            {ticket.last_message_at && (
              <>
                <span>•</span>
                <span>Last updated {format(new Date(ticket.last_message_at), 'MMM d, h:mm a')}</span>
              </>
            )}
          </div>

          <div className="space-y-4">
            {messages && <TicketConversation messages={messages} currentUserEmail={currentUser?.email} />}
          </div>
        </Card>

        {ticket.status !== 'closed' && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Add a Reply</h3>
            <form onSubmit={handleSubmitReply} className="space-y-4">
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your message..."
                rows={4}
                required
              />
              <Button type="submit" disabled={sendReply.isPending || !replyMessage.trim()}>
                <Send className="mr-2 h-4 w-4" />
                {sendReply.isPending ? 'Sending...' : 'Send Reply'}
              </Button>
            </form>
          </Card>
        )}
      </div>
    </CustomerLayout>
  );
}
