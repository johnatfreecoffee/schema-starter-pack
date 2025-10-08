import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project?: any;
  accountId?: string;
}

const ProjectForm = ({ isOpen, onClose, onSuccess, project, accountId }: ProjectFormProps) => {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    project_name: '',
    account_id: accountId || '',
    description: '',
    status: 'planning',
    start_date: '',
    estimated_completion: '',
    budget: '',
    spent: '',
  });

  useEffect(() => {
    if (project) {
      setFormData({
        project_name: project.project_name || '',
        account_id: project.account_id || accountId || '',
        description: project.description || '',
        status: project.status || 'planning',
        start_date: project.start_date || '',
        estimated_completion: project.estimated_completion || '',
        budget: project.budget || '',
        spent: project.spent || '',
      });
    } else if (accountId) {
      setFormData(prev => ({ ...prev, account_id: accountId }));
    }
  }, [project, accountId]);

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from('accounts')
      .select('id, account_name')
      .eq('status', 'active')
      .order('account_name');

    if (error) {
      console.error('Error fetching accounts:', error);
      return;
    }

    setAccounts(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const projectData = {
        project_name: formData.project_name,
        account_id: formData.account_id,
        description: formData.description || null,
        status: formData.status as 'planning' | 'active' | 'completed' | 'on_hold' | 'cancelled',
        budget: formData.budget ? parseFloat(formData.budget) : null,
        spent: formData.spent ? parseFloat(formData.spent) : null,
        start_date: formData.start_date || null,
        estimated_completion: formData.estimated_completion || null,
      };

      if (project) {
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', project.id);

        if (error) throw error;

        await supabase.from('activity_logs').insert({
          entity_type: 'project',
          entity_id: project.id,
          action: 'updated',
          user_id: user.id,
        });

        toast({ title: 'Project updated successfully' });
      } else {
        const { data: newProject, error } = await supabase
          .from('projects')
          .insert([projectData])
          .select()
          .single();

        if (error) throw error;

        await supabase.from('activity_logs').insert({
          entity_type: 'project',
          entity_id: newProject.id,
          action: 'created',
          user_id: user.id,
        });

        toast({ title: 'Project created successfully' });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? 'Edit Project' : 'Create New Project'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project_name">Project Name *</Label>
            <Input
              id="project_name"
              required
              value={formData.project_name}
              onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_id">Account *</Label>
            <Select
              value={formData.account_id}
              onValueChange={(value) => setFormData({ ...formData, account_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.account_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimated_completion">Estimated Completion</Label>
              <Input
                id="estimated_completion"
                type="date"
                value={formData.estimated_completion}
                onChange={(e) => setFormData({ ...formData, estimated_completion: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectForm;