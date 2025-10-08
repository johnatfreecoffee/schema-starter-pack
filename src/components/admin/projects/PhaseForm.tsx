import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PhaseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
  phase?: any;
}

const PhaseForm = ({ isOpen, onClose, onSuccess, projectId, phase }: PhaseFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phase_name: '',
    description: '',
    status: 'pending',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    if (phase) {
      setFormData({
        phase_name: phase.phase_name || '',
        description: phase.description || '',
        status: phase.status || 'pending',
        start_date: phase.start_date || '',
        end_date: phase.end_date || '',
      });
    } else {
      setFormData({
        phase_name: '',
        description: '',
        status: 'pending',
        start_date: '',
        end_date: '',
      });
    }
  }, [phase, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const phaseData = {
        ...formData,
        project_id: projectId,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };

      if (phase) {
        const { error } = await supabase
          .from('project_phases')
          .update(phaseData)
          .eq('id', phase.id);

        if (error) throw error;

        await supabase.from('activity_logs').insert({
          entity_type: 'project_phase',
          entity_id: phase.id,
          action: 'updated',
          user_id: user.id,
          parent_entity_type: 'project',
          parent_entity_id: projectId,
        });

        toast({ title: 'Phase updated successfully' });
      } else {
        const { data: newPhase, error } = await supabase
          .from('project_phases')
          .insert(phaseData)
          .select()
          .single();

        if (error) throw error;

        await supabase.from('activity_logs').insert({
          entity_type: 'project_phase',
          entity_id: newPhase.id,
          action: 'created',
          user_id: user.id,
          parent_entity_type: 'project',
          parent_entity_id: projectId,
        });

        toast({ title: 'Phase created successfully' });
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{phase ? 'Edit Phase' : 'Add Phase'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phase_name">Phase Name *</Label>
            <Input
              id="phase_name"
              required
              value={formData.phase_name}
              onChange={(e) => setFormData({ ...formData, phase_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : phase ? 'Update Phase' : 'Add Phase'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PhaseForm;