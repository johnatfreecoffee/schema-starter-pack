import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { CRUDLogger } from '@/lib/crudLogger';
import { workflowService } from '@/services/workflowService';

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project?: any;
  accountId?: string;
}

const ProjectForm = ({ isOpen, onClose, onSuccess, project, accountId }: ProjectFormProps) => {
  const isMobile = useIsMobile();
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
        const changes = CRUDLogger.calculateChanges(project, projectData);
        
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', project.id);

        if (error) throw error;

        await CRUDLogger.logUpdate({
          userId: user.id,
          entityType: 'project',
          entityId: project.id,
          entityName: formData.project_name,
          changes
        });

        // Trigger workflow for record update
        try {
          await workflowService.triggerWorkflows({
            workflow_id: '',
            trigger_record_id: project.id,
            trigger_module: 'projects',
            trigger_data: {
              ...projectData,
              entity_type: 'project',
              previous_data: project,
            },
          });
        } catch (workflowError) {
          console.error('⚠️ Workflow trigger failed (non-critical):', workflowError);
        }

        toast({ title: 'Project updated successfully' });
      } else {
        const { data: newProject, error } = await supabase
          .from('projects')
          .insert([projectData])
          .select()
          .single();

        if (error) throw error;

        await CRUDLogger.logCreate({
          userId: user.id,
          entityType: 'project',
          entityId: newProject.id,
          entityName: formData.project_name
        });

        // Trigger workflow for new record
        try {
          await workflowService.triggerWorkflows({
            workflow_id: '',
            trigger_record_id: newProject.id,
            trigger_module: 'projects',
            trigger_data: {
              ...newProject,
              entity_type: 'project',
            },
          });
        } catch (workflowError) {
          console.error('⚠️ Workflow trigger failed (non-critical):', workflowError);
        }

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

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="project_name">Project Name *</Label>
        <Input
          id="project_name"
          required
          value={formData.project_name}
          onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
          className="min-h-[44px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="account_id">Account *</Label>
        <Select
          value={formData.account_id}
          onValueChange={(value) => setFormData({ ...formData, account_id: value })}
          required
        >
          <SelectTrigger className="min-h-[44px]">
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
          className="min-h-[44px]"
        />
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger className="min-h-[44px]">
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
            className="min-h-[44px]"
          />
        </div>
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        <div className="space-y-2">
          <Label htmlFor="estimated_completion">Estimated Completion</Label>
          <Input
            id="estimated_completion"
            type="date"
            value={formData.estimated_completion}
            onChange={(e) => setFormData({ ...formData, estimated_completion: e.target.value })}
            className="min-h-[44px]"
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
            className="min-h-[44px]"
          />
        </div>
      </div>

      <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'justify-end'}`}>
        <Button type="button" variant="outline" onClick={onClose} className={isMobile ? 'w-full' : ''}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className={isMobile ? 'w-full' : ''}>
          {loading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{project ? 'Edit Project' : 'Create New Project'}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{formContent}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? 'Edit Project' : 'Create New Project'}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default ProjectForm;