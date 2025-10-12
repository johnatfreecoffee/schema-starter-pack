import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Ticket, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TicketFilters } from '@/components/admin/tickets/TicketFilters';
import { TicketPriorityBadge } from '@/components/admin/tickets/TicketPriorityBadge';
import { TicketStatusBadge } from '@/components/admin/tickets/TicketStatusBadge';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function Tickets() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['tickets', statusFilter, priorityFilter, categoryFilter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('tickets')
        .select(`
          *,
          account:accounts(account_name, id),
          assigned_user:assigned_to(email)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }
      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter as any);
      }
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter as any);
      }
      if (searchQuery) {
        query = query.or(`ticket_number.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['ticket-stats'],
    queryFn: async () => {
      const { data: allTickets, error } = await supabase
        .from('tickets')
        .select('status, priority');
      
      if (error) throw error;

      return {
        total: allTickets.length,
        open: allTickets.filter(t => t.status === 'open' || t.status === 'new').length,
        urgent: allTickets.filter(t => t.priority === 'urgent').length,
        resolved: allTickets.filter(t => t.status === 'resolved').length
      };
    }
  });

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Support Tickets</h1>
            <p className="text-muted-foreground">Manage customer support requests</p>
          </div>
          <Button onClick={() => navigate('/dashboard/tickets/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Ticket className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold">{stats?.open || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Urgent</p>
                <p className="text-2xl font-bold">{stats?.urgent || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold">{stats?.resolved || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        <TicketFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
        />

        <Card>
          <div className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4">
                  <Skeleton className="h-20 w-full" />
                </div>
              ))
            ) : tickets && tickets.length > 0 ? (
              tickets.map((ticket: any) => (
                <div
                  key={ticket.id}
                  className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/dashboard/tickets/${ticket.id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-muted-foreground">
                          {ticket.ticket_number}
                        </span>
                        <TicketPriorityBadge priority={ticket.priority} />
                        <TicketStatusBadge status={ticket.status} />
                        {ticket.unread_by_agent && (
                          <span className="h-2 w-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <h3 className="font-semibold text-lg mb-1 truncate">
                        {ticket.subject}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{ticket.account?.account_name}</span>
                        <span>•</span>
                        <span className="capitalize">{ticket.category}</span>
                        <span>•</span>
                        <span>{format(new Date(ticket.created_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    {ticket.assigned_user && (
                      <div className="text-sm text-muted-foreground">
                        Assigned to {ticket.assigned_user.email}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tickets found</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
