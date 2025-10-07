import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PhoneInput } from '@/components/lead-form/PhoneInput';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  contact?: any;
  onSuccess: () => void;
}

export const ContactForm = ({ open, onOpenChange, accountId, contact, onSuccess }: ContactFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: contact?.first_name || '',
    last_name: contact?.last_name || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    title: contact?.title || '',
    is_primary: contact?.is_primary || false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // If setting as primary, unset other primary contacts
      if (formData.is_primary) {
        await supabase
          .from('contacts')
          .update({ is_primary: false })
          .eq('account_id', accountId)
          .neq('id', contact?.id || '');
      }

      if (contact) {
        // Update existing contact
        const { error } = await supabase
          .from('contacts')
          .update(formData)
          .eq('id', contact.id);

        if (error) throw error;
      } else {
        // Create new contact
        const { error } = await supabase
          .from('contacts')
          .insert({
            ...formData,
            account_id: accountId
          });

        if (error) throw error;

        // Log activity
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('activity_logs').insert([{
            user_id: user.id,
            action: 'created' as const,
            entity_type: 'contact',
            entity_id: crypto.randomUUID(),
            parent_entity_type: 'account',
            parent_entity_id: accountId
          }]);
        }
      }

      toast({
        title: 'Success',
        description: `Contact ${contact ? 'updated' : 'created'} successfully`
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{contact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone *</Label>
            <PhoneInput
              value={formData.phone}
              onChange={(value) => setFormData({ ...formData, phone: value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="title">Title/Position</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_primary"
              checked={formData.is_primary}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, is_primary: checked as boolean })
              }
            />
            <Label htmlFor="is_primary" className="cursor-pointer">
              Set as primary contact
            </Label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : contact ? 'Update Contact' : 'Add Contact'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
