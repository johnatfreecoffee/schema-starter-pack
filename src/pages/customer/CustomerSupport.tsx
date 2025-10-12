import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import CustomerLayout from '@/components/layout/CustomerLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Ticket, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TicketPriorityBadge } from '@/components/admin/tickets/TicketPriorityBadge';
import { TicketStatusBadge } from '@/components/admin/tickets/TicketStatusBadge';
import { format } from 'date-fns';

export default function CustomerSupport() {
  const navigate = useNavigate();

  const { data: account } = useQuery({
    queryKey: ['customer-account'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['customer-tickets', account?.id],
    queryFn: async () => {
      if (!account?.id) return [];

      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('account_id', account.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!account?.id
  });

  const openTickets = tickets?.filter(t => t.status !== 'closed' && t.status !== 'resolved').length || 0;

  return (
    <CustomerLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Support Center</h1>
            <p className="text-muted-foreground">Get help and track your requests</p>
          </div>
          <Button onClick={() => navigate('/customer/support/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Submit Request
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Ticket className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
                <p className="text-3xl font-bold">{tickets?.length || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Open Tickets</p>
                <p className="text-3xl font-bold">{openTickets}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">My Support Requests</h2>
          </div>
          <div className="divide-y">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading tickets...
              </div>
            ) : tickets && tickets.length > 0 ? (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/customer/support/${ticket.id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm text-muted-foreground">
                          {ticket.ticket_number}
                        </span>
                        <TicketPriorityBadge priority={ticket.priority} />
                        <TicketStatusBadge status={ticket.status} />
                        {ticket.unread_by_customer && (
                          <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                            <span className="h-2 w-2 bg-blue-500 rounded-full" />
                            New Reply
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold mb-1">{ticket.subject}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="capitalize">{ticket.category}</span>
                        <span>•</span>
                        <span>Created {format(new Date(ticket.created_at), 'MMM d, yyyy')}</span>
                        {ticket.last_message_at && (
                          <>
                            <span>•</span>
                            <span>Last updated {format(new Date(ticket.last_message_at), 'MMM d, h:mm a')}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">You haven't submitted any support requests yet</p>
                <Button onClick={() => navigate('/customer/support/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Submit Your First Request
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </CustomerLayout>
  );
}
