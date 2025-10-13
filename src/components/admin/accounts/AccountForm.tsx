import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhoneInput } from '@/components/lead-form/PhoneInput';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CRUDLogger } from '@/lib/crudLogger';
import { useIsMobile } from '@/hooks/use-mobile';

interface AccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: any;
  onSuccess: () => void;
}

export const AccountForm = ({ open, onOpenChange, account, onSuccess }: AccountFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();
  
  const [formData, setFormData] = useState({
    account_name: account?.account_name || '',
    industry: account?.industry || '',
    website: account?.website || '',
    status: account?.status || 'active',
    notes: account?.notes || '',
    // Primary contact (only for new accounts)
    contact_first_name: '',
    contact_last_name: '',
    contact_email: '',
    contact_phone: '',
    contact_title: '',
    // Primary address (only for new accounts)
    street_address: '',
    unit: '',
    city: '',
    state: '',
    zip: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (account) {
        // Update existing account
        const updates = {
          account_name: formData.account_name,
          industry: formData.industry,
          website: formData.website,
          status: formData.status,
          notes: formData.notes,
          updated_at: new Date().toISOString()
        };

        const changes = CRUDLogger.calculateChanges(account, updates);

        const { error } = await supabase
          .from('accounts')
          .update(updates)
          .eq('id', account.id);

        if (error) throw error;

        await CRUDLogger.logUpdate({
          userId: user.id,
          entityType: 'account',
          entityId: account.id,
          entityName: formData.account_name,
          changes
        });

        toast({
          title: 'Success',
          description: 'Account updated successfully'
        });
      } else {
        // Create new account
        const { data: accountData, error: accountError } = await supabase
          .from('accounts')
          .insert({
            account_name: formData.account_name,
            industry: formData.industry,
            website: formData.website,
            status: formData.status,
            notes: formData.notes
          })
          .select()
          .single();

        if (accountError) throw accountError;

        // Create primary contact
        const { error: contactError } = await supabase
          .from('contacts')
          .insert({
            account_id: accountData.id,
            first_name: formData.contact_first_name,
            last_name: formData.contact_last_name,
            email: formData.contact_email,
            phone: formData.contact_phone,
            title: formData.contact_title,
            is_primary: true
          });

        if (contactError) throw contactError;

        // Create primary address
        const { error: addressError } = await supabase
          .from('addresses')
          .insert({
            entity_type: 'account',
            entity_id: accountData.id,
            account_id: accountData.id, // Legacy field for backward compatibility
            street_1: formData.street_address,
            street_2: formData.unit,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
            address_type: 'billing',
            is_primary: true
          });

        if (addressError) throw addressError;

        // Log activity
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('activity_logs').insert([{
            user_id: user.id,
            action: 'created' as const,
            entity_type: 'account',
            entity_id: accountData.id
          }]);
        }

        toast({
          title: 'Success',
          description: 'Account created successfully'
        });
      }

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold">Account Information</h3>
        
        <div>
          <Label htmlFor="account_name">Account Name *</Label>
          <Input
            id="account_name"
            value={formData.account_name}
            onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
            required
            className="min-h-[44px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="min-h-[44px]"
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger className="min-h-[44px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            placeholder="https://example.com"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="min-h-[44px]"
          />
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="min-h-[44px]"
          />
        </div>
      </div>

      {!account && (
        <>
          <div className="space-y-4">
            <h3 className="font-semibold">Primary Contact</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_first_name">First Name *</Label>
                <Input
                  id="contact_first_name"
                  value={formData.contact_first_name}
                  onChange={(e) => setFormData({ ...formData, contact_first_name: e.target.value })}
                  required
                  className="min-h-[44px]"
                />
              </div>

              <div>
                <Label htmlFor="contact_last_name">Last Name *</Label>
                <Input
                  id="contact_last_name"
                  value={formData.contact_last_name}
                  onChange={(e) => setFormData({ ...formData, contact_last_name: e.target.value })}
                  required
                  className="min-h-[44px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_email">Email *</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  required
                  className="min-h-[44px]"
                />
              </div>

              <div>
                <Label htmlFor="contact_phone">Phone *</Label>
                <PhoneInput
                  value={formData.contact_phone}
                  onChange={(value) => setFormData({ ...formData, contact_phone: value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="contact_title">Title</Label>
              <Input
                id="contact_title"
                value={formData.contact_title}
                onChange={(e) => setFormData({ ...formData, contact_title: e.target.value })}
                className="min-h-[44px]"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Primary Address</h3>
            
            <div>
              <Label htmlFor="street_address">Street Address *</Label>
              <Input
                id="street_address"
                value={formData.street_address}
                onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                required
                className="min-h-[44px]"
              />
            </div>

            <div>
              <Label htmlFor="unit">Apartment/Unit/Floor</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="min-h-[44px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                  className="min-h-[44px]"
                />
              </div>

              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                  className="min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="zip">Zip Code *</Label>
              <Input
                id="zip"
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                required
                className="min-h-[44px]"
              />
            </div>
          </div>
        </>
      )}

      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row justify-end'} gap-2`}>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className={isMobile ? 'w-full' : ''}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className={isMobile ? 'w-full' : ''}>
          {loading ? 'Saving...' : account ? 'Update Account' : 'Create Account'}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{account ? 'Edit Account' : 'Create New Account'}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {formContent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{account ? 'Edit Account' : 'Create New Account'}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};
