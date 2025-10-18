import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { CRUDLogger } from '@/lib/crudLogger';

interface LeadConvertProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
}

export const LeadConvert = ({ isOpen, onClose, lead }: LeadConvertProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    setLoading(true);

    try {
      // 1. Create Account
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .insert({
          account_name: `${lead.first_name} ${lead.last_name}`,
          source_lead_id: lead.id,
          status: 'active'
        })
        .select()
        .single();

      if (accountError) throw accountError;

      // 2. Create Contact
      const { error: contactError } = await supabase
        .from('contacts')
        .insert({
          account_id: account.id,
          first_name: lead.first_name,
          last_name: lead.last_name,
          email: lead.email,
          phone: lead.phone,
          is_primary: true
        });

      if (contactError) throw contactError;

      // 3. Create Address
      const { error: addressError } = await supabase
        .from('addresses')
        .insert({
          entity_type: 'account',
          entity_id: account.id,
          account_id: account.id, // Legacy field for backward compatibility
          street_1: lead.street_address,
          street_2: lead.unit,
          city: lead.city,
          state: lead.state,
          zip: lead.zip,
          is_primary: true
        });

      if (addressError) throw addressError;

      // 4. Create Project
      const { error: projectError } = await supabase
        .from('projects')
        .insert({
          account_id: account.id,
          project_name: `${lead.service_needed} - ${lead.city}`,
          status: 'planning',
          source_lead_id: lead.id
        });

      if (projectError) throw projectError;

      // 5. Update Lead
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          status: 'converted',
          converted_account_id: account.id
        })
        .eq('id', lead.id);

      if (updateError) throw updateError;

      // 6. Log Activities
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await CRUDLogger.logConvert({
        userId: user.id,
        entityType: 'lead',
        entityId: lead.id,
        entityName: `${lead.first_name} ${lead.last_name}`,
        convertedTo: 'account',
        convertedToId: account.id
      });

      await CRUDLogger.logCreate({
        userId: user.id,
        entityType: 'account',
        entityId: account.id,
        entityName: account.account_name
      });

      toast({
        title: 'Success',
        description: 'Lead converted! Account created.'
      });

      onClose();
      navigate(`/dashboard/accounts/${account.id}`);
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert Lead to Account</DialogTitle>
          <DialogDescription>
            This will create an account, contact, address, and project for this lead.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Lead Information</h4>
            <div className="text-sm space-y-1">
              <p><strong>Name:</strong> {lead?.first_name} {lead?.last_name}</p>
              <p><strong>Email:</strong> {lead?.email}</p>
              <p><strong>Phone:</strong> {lead?.phone}</p>
              <p><strong>Service:</strong> {lead?.service_needed}</p>
              <p><strong>Address:</strong> {lead?.street_address}, {lead?.city}, {lead?.state} {lead?.zip}</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Are you sure you want to convert this lead? This action cannot be undone.
          </p>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleConvert} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Convert to Account
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};