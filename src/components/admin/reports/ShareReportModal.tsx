import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ShareReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string;
  currentSharedWith: string[];
  currentIsPublic: boolean;
  onUpdate: () => void;
}

const ShareReportModal = ({
  open,
  onOpenChange,
  reportId,
  currentSharedWith,
  currentIsPublic,
  onUpdate
}: ShareReportModalProps) => {
  const [isPublic, setIsPublic] = useState(currentIsPublic);
  const [sharedWith, setSharedWith] = useState<string[]>(currentSharedWith || []);
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (sharedWith.includes(email)) {
      toast.error('Email already added');
      return;
    }
    
    setSharedWith([...sharedWith, email]);
    setNewEmail('');
  };

  const handleRemoveEmail = (email: string) => {
    setSharedWith(sharedWith.filter(e => e !== email));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('reports')
        .update({
          is_public: isPublic,
          shared_with: sharedWith
        })
        .eq('id', reportId);

      if (error) throw error;

      toast.success('Sharing settings updated');
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating sharing settings:', error);
      toast.error('Failed to update sharing settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Public Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Make Public</Label>
              <p className="text-sm text-muted-foreground">
                All CRM users can view this report
              </p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {/* Share with specific users */}
          <div className="space-y-3">
            <Label>Share with Specific Users</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="user@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEmail();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddEmail}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* List of shared users */}
            {sharedWith.length > 0 && (
              <div className="space-y-2">
                {sharedWith.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between p-2 bg-muted rounded-lg"
                  >
                    <span className="text-sm">{email}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveEmail(email)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareReportModal;
