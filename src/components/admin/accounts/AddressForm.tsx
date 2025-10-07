import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AddressFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  address?: any;
  onSuccess: () => void;
}

export const AddressForm = ({ open, onOpenChange, accountId, address, onSuccess }: AddressFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    address_type: address?.address_type || 'billing',
    street_address: address?.street_address || '',
    unit: address?.unit || '',
    city: address?.city || '',
    state: address?.state || '',
    zip: address?.zip || '',
    is_primary: address?.is_primary || false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // If setting as primary, unset other primary addresses
      if (formData.is_primary) {
        await supabase
          .from('addresses')
          .update({ is_primary: false })
          .eq('account_id', accountId)
          .neq('id', address?.id || '');
      }

      if (address) {
        // Update existing address
        const { error } = await supabase
          .from('addresses')
          .update(formData)
          .eq('id', address.id);

        if (error) throw error;
      } else {
        // Create new address
        const { error } = await supabase
          .from('addresses')
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
            entity_type: 'address',
            entity_id: crypto.randomUUID(),
            parent_entity_type: 'account',
            parent_entity_id: accountId
          }]);
        }
      }

      toast({
        title: 'Success',
        description: `Address ${address ? 'updated' : 'created'} successfully`
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
          <DialogTitle>{address ? 'Edit Address' : 'Add Address'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="address_type">Address Type</Label>
            <Select 
              value={formData.address_type} 
              onValueChange={(value) => setFormData({ ...formData, address_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="mailing">Mailing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="street_address">Street Address *</Label>
            <Input
              id="street_address"
              value={formData.street_address}
              onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="unit">Apartment/Unit/Floor</Label>
            <Input
              id="unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
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
              Set as primary address
            </Label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : address ? 'Update Address' : 'Add Address'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
