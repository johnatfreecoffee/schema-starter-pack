import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import CustomerLayout from '@/components/layout/CustomerLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

export default function CustomerSubmitTicket() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'medium',
    category: 'general',
    projectId: ''
  });

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

  const { data: projects } = useQuery({
    queryKey: ['customer-projects', account?.id],
    queryFn: async () => {
      if (!account?.id) return [];

      const { data, error } = await supabase
        .from('projects')
        .select('id, project_name')
        .eq('account_id', account.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!account?.id
  });

  const createTicket = useMutation({
    mutationFn: async () => {
      if (!account?.id) throw new Error('Account not found');

      // Generate ticket number
      const { data: ticketNumberData } = await supabase.rpc('generate_ticket_number');
      const ticketNumber = ticketNumberData || `TICKET-${Date.now()}`;

      // Create ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert([{
          ticket_number: ticketNumber,
          account_id: account.id,
          subject: formData.subject,
          priority: formData.priority as any,
          category: formData.category as any,
          status: 'new',
          project_id: formData.projectId || null
        }])
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Create initial message
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: messageError } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: user!.id,
          message: formData.message,
          is_internal_note: false
        });

      if (messageError) throw messageError;

      return ticket;
    },
    onSuccess: (ticket) => {
      toast({
        title: 'Ticket Submitted',
        description: `Your support request #${ticket.ticket_number} has been created. We'll respond shortly.`
      });
      navigate(`/customer/support/${ticket.id}`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to submit ticket. Please try again.',
        variant: 'destructive'
      });
      console.error('Error creating ticket:', error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTicket.mutate();
  };

  return (
    <CustomerLayout>
      <div className="container mx-auto p-6 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/customer/support')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Support
        </Button>

        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-2">Submit Support Request</h1>
          <p className="text-muted-foreground mb-6">
            Describe your issue and we'll get back to you as soon as possible
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Brief description of your issue"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Support</SelectItem>
                    <SelectItem value="support">Technical Support</SelectItem>
                    <SelectItem value="billing">Billing Question</SelectItem>
                    <SelectItem value="project">Project Related</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - General inquiry</SelectItem>
                    <SelectItem value="medium">Medium - Issue affecting work</SelectItem>
                    <SelectItem value="high">High - Blocking work</SelectItem>
                    <SelectItem value="urgent">Urgent - Critical issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {projects && projects.length > 0 && (
              <div>
                <Label htmlFor="project">Related Project (Optional)</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.project_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Provide detailed information about your issue..."
                rows={8}
                required
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={createTicket.isPending}
                className="flex-1"
              >
                {createTicket.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/customer/support')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </CustomerLayout>
  );
}
