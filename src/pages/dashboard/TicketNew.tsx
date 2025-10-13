import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { FileAttachments } from '@/components/admin/tickets/FileAttachments';

export default function TicketNew() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    accountId: '',
    subject: '',
    message: '',
    priority: 'medium',
    category: 'general',
    assignedTo: '',
    projectId: ''
  });
  const [attachments, setAttachments] = useState<string[]>([]);

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, account_name')
        .order('account_name');
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
      return data;
    }
  });

  const { data: templates } = useQuery({
    queryKey: ['ticket-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_templates' as any)
        .select('*')
        .order('name');
      if (error) throw error;
      return data as any[];
    }
  });

  const { data: projects } = useQuery({
    queryKey: ['projects', formData.accountId],
    queryFn: async () => {
      if (!formData.accountId) return [];
      const { data, error } = await supabase
        .from('projects')
        .select('id, project_name')
        .eq('account_id', formData.accountId);
      if (error) throw error;
      return data;
    },
    enabled: !!formData.accountId
  });

  const createTicket = useMutation({
    mutationFn: async () => {
      if (!formData.accountId) throw new Error('Account is required');

      const { data: ticketNumberData } = await supabase.rpc('generate_ticket_number');
      const ticketNumber = ticketNumberData || `TICKET-${Date.now()}`;

      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert([{
          ticket_number: ticketNumber,
          account_id: formData.accountId,
          subject: formData.subject,
          priority: formData.priority as any,
          category: formData.category as any,
          status: 'new',
          assigned_to: formData.assignedTo || null,
          project_id: formData.projectId || null
        }])
        .select()
        .single();

      if (ticketError) throw ticketError;

      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: messageError } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: user!.id,
          message: formData.message,
          is_internal_note: false,
          attachments: attachments.length > 0 ? attachments : null
        });

      if (messageError) throw messageError;

      return ticket;
    },
    onSuccess: (ticket) => {
      toast({
        title: 'Ticket Created',
        description: `Ticket #${ticket.ticket_number} has been created successfully.`
      });
      navigate(`/dashboard/tickets/${ticket.id}`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create ticket. Please try again.',
        variant: 'destructive'
      });
      console.error('Error creating ticket:', error);
    }
  });

  const applyTemplate = (templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        category: template.category,
        priority: template.priority,
        subject: template.subject_template,
        message: template.message_template,
        assignedTo: template.default_assignee || ''
      });
      toast({ title: 'Template Applied', description: `"${template.name}" template has been applied.` });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTicket.mutate();
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/tickets')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tickets
        </Button>

        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-2">Create New Ticket</h1>
          <p className="text-muted-foreground mb-6">
            Create a support ticket on behalf of a customer
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {templates && templates.length > 0 && (
              <div>
                <Label>Apply Template (Optional)</Label>
                <Select onValueChange={applyTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template to quick-fill" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({template.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="accountId">Customer Account *</Label>
              <Select
                value={formData.accountId}
                onValueChange={(value) => setFormData({ ...formData, accountId: value, projectId: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Brief description of the issue"
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
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assignedTo">Assign To (Optional)</Label>
                <Select
                  value={formData.assignedTo}
                  onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {users?.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.user_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            </div>

            <div>
              <Label htmlFor="message">Initial Message *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Detailed description of the issue..."
                rows={8}
                required
              />
            </div>

            <FileAttachments
              onFilesUploaded={setAttachments}
              existingFiles={attachments}
              maxFiles={5}
            />

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={createTicket.isPending}
                className="flex-1"
              >
                {createTicket.isPending ? 'Creating...' : 'Create Ticket'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/tickets')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
}
