import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PhoneInput } from '@/components/lead-form/PhoneInput';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface ContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  contact?: any;
  onSuccess: () => void;
}

export const ContactForm = ({ open, onOpenChange, accountId, contact, onSuccess }: ContactFormProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: contact?.first_name || '',
    last_name: contact?.last_name || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    mobile: contact?.mobile || '',
    title: contact?.title || '',
    department: contact?.department || '',
    notes: contact?.notes || '',
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

      const { data: { user } } = await supabase.auth.getUser();

      if (contact) {
        // Update existing contact
        const { error } = await supabase
          .from('contacts')
          .update({
            ...formData,
            updated_by: user?.id
          })
          .eq('id', contact.id);

        if (error) throw error;
      } else {
        // Create new contact
        const { error } = await supabase
          .from('contacts')
          .insert({
            ...formData,
            account_id: accountId,
            created_by: user?.id
          });

        if (error) throw error;
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

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        <div>
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            required
            className="min-h-[44px]"
          />
        </div>

        <div>
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            required
            className="min-h-[44px]"
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
          className="min-h-[44px]"
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
        <Label htmlFor="mobile">Mobile</Label>
        <PhoneInput
          value={formData.mobile}
          onChange={(value) => setFormData({ ...formData, mobile: value })}
        />
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        <div>
          <Label htmlFor="title">Title/Position</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="min-h-[44px]"
          />
        </div>

        <div>
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            className="min-h-[44px]"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Internal Notes</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Internal notes about this contact"
          className="min-h-[44px]"
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

      <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'justify-end'}`}>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className={isMobile ? 'w-full' : ''}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className={isMobile ? 'w-full' : ''}>
          {loading ? 'Saving...' : contact ? 'Update Contact' : 'Add Contact'}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{contact ? 'Edit Contact' : 'Add Contact'}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{formContent}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{contact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};
