import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function TicketTemplates() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'support',
    priority: 'medium',
    default_assignee: '',
    subject_template: '',
    message_template: ''
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ['ticket-templates', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('ticket_templates' as any)
        .select('*')
        .order('usage_count', { ascending: false });

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,subject_template.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
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

  const createTemplate = useMutation({
    mutationFn: async (data: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('ticket_templates' as any)
        .insert({
          ...data,
          created_by: user!.id
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-templates'] });
      toast({ title: 'Template created successfully' });
      setIsDialogOpen(false);
      resetForm();
    }
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase
        .from('ticket_templates' as any)
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-templates'] });
      toast({ title: 'Template updated successfully' });
      setIsDialogOpen(false);
      resetForm();
    }
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ticket_templates' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-templates'] });
      toast({ title: 'Template deleted successfully' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTemplate) {
      updateTemplate.mutate({ id: editingTemplate.id, ...formData });
    } else {
      createTemplate.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'support',
      priority: 'medium',
      default_assignee: '',
      subject_template: '',
      message_template: ''
    });
    setEditingTemplate(null);
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      priority: template.priority,
      default_assignee: template.default_assignee || '',
      subject_template: template.subject_template,
      message_template: template.message_template
    });
    setIsDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Ticket Templates</h1>
            <p className="text-muted-foreground">Quick-start templates for common issues</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Edit Ticket Template' : 'Create Ticket Template'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Password Reset Request"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Default Priority *</Label>
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

                <div>
                  <Label htmlFor="default_assignee">Default Assignee (Optional)</Label>
                  <Select
                    value={formData.default_assignee}
                    onValueChange={(value) => setFormData({ ...formData, default_assignee: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {users?.map((user) => (
                        <SelectItem key={user.user_id} value={user.user_id}>
                          {user.user_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subject_template">Subject Template *</Label>
                  <Input
                    id="subject_template"
                    value={formData.subject_template}
                    onChange={(e) => setFormData({ ...formData, subject_template: e.target.value })}
                    placeholder="e.g., Unable to access account"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="message_template">Message Template *</Label>
                  <Textarea
                    id="message_template"
                    value={formData.message_template}
                    onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                    placeholder="Template message..."
                    rows={6}
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Variables: {'{'}customer_name{'}'}, {'{'}ticket_number{'}'}, {'{'}company_name{'}'}
                  </p>
                </div>

                <div className="flex gap-4 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTemplate.isPending || updateTemplate.isPending}>
                    {editingTemplate ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Templates List */}
        <div className="grid gap-4">
          {isLoading ? (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">Loading...</p>
            </Card>
          ) : templates && templates.length > 0 ? (
            templates.map((template) => (
              <Card key={template.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      <Badge variant="outline" className="capitalize">
                        {template.category}
                      </Badge>
                      <Badge variant="secondary" className="capitalize">
                        {template.priority}
                      </Badge>
                      {template.usage_count > 0 && (
                        <Badge>Used {template.usage_count} times</Badge>
                      )}
                    </div>
                    <p className="font-medium text-sm mb-1">{template.subject_template}</p>
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                      {template.message_template}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Delete this template?')) {
                          deleteTemplate.mutate(template.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No templates found</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Template
              </Button>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
